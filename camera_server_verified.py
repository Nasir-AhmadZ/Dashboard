#!/usr/bin/env python3
"""
Camera Server with Facial Verification State Machine
"""

from flask import Flask, Response
from picamera2 import Picamera2
import tensorflow as tf
from tensorflow.keras.layers import Layer
import numpy as np
import cv2
import os
import io
import threading
from transitions import Machine

app = Flask(__name__)

# L1 Distance Layer
class L1Dist(Layer):
    def __init__(self, **kwargs):
        super().__init__()
    
    def call(self, input_embedding, validation_embedding):
        return tf.math.abs(input_embedding - validation_embedding)

# Preprocessing function
def preprocess(img_array):
    img = tf.image.resize(img_array, (100, 100))
    img = img / 255.0
    return img

# Load model
model = tf.keras.models.load_model('siamesemodelv2.h5', 
                                   custom_objects={'L1Dist': L1Dist, 'BinaryCrossentropy': tf.losses.BinaryCrossentropy})

# Verification State Machine
class VerificationStateMachine:
    states = ['unverified', 'verifying', 'verified']
    
    def __init__(self):
        self.verified_user = False
        self.current_frame = None
        self.lock = threading.Lock()
        
        self.machine = Machine(model=self, states=VerificationStateMachine.states, initial='unverified')
        
        self.machine.add_transition('start_verify', 'unverified', 'verifying')
        self.machine.add_transition('verify_success', 'verifying', 'verified')
        self.machine.add_transition('verify_fail', 'verifying', 'unverified')
        self.machine.add_transition('reset', '*', 'unverified')
    
    def verify_frame(self, frame):
        """Verify current frame against reference images"""
        if not os.path.exists('application_data/verification_images'):
            return False
        
        verification_images = os.listdir('application_data/verification_images')
        if len(verification_images) == 0:
            return False
        
        # Preprocess current frame
        input_img = preprocess(frame)
        
        # Compare against verification images
        matches = 0
        for val_image in verification_images:
            val_path = os.path.join('application_data/verification_images', val_image)
            byte_img = tf.io.read_file(val_path)
            img = tf.io.decode_jpeg(byte_img)
            validation_img = preprocess(img)
            
            result = model.predict(list(np.expand_dims([input_img, validation_img], axis=1)), verbose=0)
            if result[0][0] > 0.5:
                matches += 1
        
        return matches > 10
    
    def process_frame(self, frame):
        """Process frame based on current state"""
        with self.lock:
            self.current_frame = frame
            
            if self.state == 'unverified':
                self.start_verify()
            
            if self.state == 'verifying':
                if self.verify_frame(frame):
                    self.verify_success()
                    self.verified_user = True
                    print("✓ User verified!")
                else:
                    self.verify_fail()
            
            return self.verified_user

# Initialize state machine
vsm = VerificationStateMachine()

# Initialize camera
picam2 = Picamera2()
config = picam2.create_video_configuration(
    main={"size": (640, 480), "format": "RGB888"},
    controls={"FrameRate": 15}
)
picam2.configure(config)

class StreamingOutput:
    def __init__(self):
        self.frame = None
        self.condition = threading.Condition()
    
    def write(self, frame):
        with self.condition:
            self.frame = frame
            self.condition.notify_all()

output = StreamingOutput()

def generate_frames():
    """Generator function to yield frames"""
    while True:
        frame = picam2.capture_array()
        
        # Process through verification state machine
        is_verified = vsm.process_frame(frame)
        
        # Add verification status overlay
        color = (0, 255, 0) if is_verified else (0, 0, 255)
        status = "VERIFIED" if is_verified else "VERIFYING..."
        cv2.putText(frame, status, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
        
        # Encode frame
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/stream')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/status')
def status():
    return {
        'status': 'running',
        'verified': vsm.verified_user,
        'state': vsm.state
    }

@app.route('/reset')
def reset():
    vsm.reset()
    vsm.verified_user = False
    return {'status': 'reset', 'state': vsm.state}

@app.route('/')
def index():
    return '''
    <html>
        <head><title>Verified Camera Stream</title></head>
        <body>
            <h1>Camera Stream with Facial Verification</h1>
            <img src="/stream" width="100%">
            <p><a href="/reset">Reset Verification</a></p>
        </body>
    </html>
    '''

if __name__ == '__main__':
    print("Starting camera server with facial verification...")
    picam2.start()
    
    print("Server running at http://0.0.0.0:8080")
    print("Stream: http://0.0.0.0:8080/stream")
    
    try:
        app.run(host='0.0.0.0', port=8080, threaded=True)
    except KeyboardInterrupt:
        print("\nStopping...")
        picam2.stop()
