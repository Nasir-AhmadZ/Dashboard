#!/usr/bin/env python3
"""
Camera Server with Facial Verification State Machine
"""

import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'

import io
import threading
import json
from datetime import datetime
from flask import Flask, Response, request, jsonify
from flask_cors import CORS
import requests as http_requests
from picamera2 import Picamera2
import tensorflow as tf
from tensorflow.keras.layers import Layer
from tensorflow.keras import layers, models
import numpy as np
import cv2
from transitions import Machine
from PIL import Image

# Limit TensorFlow memory usage
gpus = tf.config.list_physical_devices('GPU')
for gpu in gpus:
    tf.config.experimental.set_memory_growth(gpu, True)

tf.config.threading.set_inter_op_parallelism_threads(2)
tf.config.threading.set_intra_op_parallelism_threads(2)

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:3000'])
class L1Dist(Layer):
    def __init__(self, **kwargs):
        super().__init__()
    
    def call(self, input_embedding, validation_embedding):
        return tf.math.abs(input_embedding - validation_embedding)

# L1 Distance Layer
def preprocess(img_array):
    img = tf.image.resize(img_array, (100, 100))
    img = img / 255.0
    return img

# Preprocessing function
model = tf.keras.models.load_model('/home/nasir/dashboard/siamesemodelv2.h5', 
                                   custom_objects={'L1Dist': L1Dist, 'BinaryCrossentropy': tf.losses.BinaryCrossentropy})

# Load Siamese model
def VGGNet():
    inp = layers.Input((240, 240, 3))
    x = layers.Conv2D(64, 3, 1, activation='relu')(inp)
    x = layers.Conv2D(64, 3, 1, activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D(2, 2)(x)
    x = layers.Conv2D(128, 3, 1, activation='relu')(x)
    x = layers.Conv2D(128, 3, 1, activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D(2, 2)(x)
    x = layers.Conv2D(256, 3, 1, activation='relu')(x)
    x = layers.Conv2D(256, 3, 1, activation='relu')(x)
    x = layers.Conv2D(256, 3, 1, activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D(2, 2)(x)
    x = layers.Conv2D(512, 3, 1, activation='relu')(x)
    x = layers.Conv2D(512, 3, 1, activation='relu')(x)
    x = layers.Conv2D(512, 3, 1, activation='relu')(x)
    x = layers.MaxPooling2D(2, 2)(x)
    x = layers.Flatten()(x)
    x = layers.Dense(4096, activation='relu')(x)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(4096, activation='relu')(x)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(5, activation='softmax')(x)
    return models.Model(inputs=inp, outputs=x)

model_VGG = VGGNet()
model_VGG.load_weights('/home/nasir/dashboard/cpVGG.weights.h5')
class_labels = ['Other', 'Safe', 'Talking', 'Texting', 'Turn']
behavior_scores = {'Other': -2, 'Safe': 10, 'Talking': -5, 'Texting': -10, 'Turn': 5}

# Behavior log file
behavior_log_file = '/home/nasir/dashboard/TTA-Frontend/behavior_log.json'

# Verification State Machine
class VerificationStateMachine:
    states = ['unverified', 'verifying', 'verified']
    
    def __init__(self):
        self.verified_user = False
        self.detected_username = None
        self.expected_username = None
        self.current_frame = None
        self.lock = threading.Lock()
        self.frame_count = 0
        self.current_behavior = "Unknown"
        self.behavior_buffer = []
        self.last_recorded_behavior = None
        
        self.machine = Machine(model=self, states=VerificationStateMachine.states, initial='unverified')
        
        self.machine.add_transition('start_verify', 'unverified', 'verifying')
        self.machine.add_transition('verify_success', 'verifying', 'verified')
        self.machine.add_transition('verify_fail', 'verifying', 'unverified')
        self.machine.add_transition('reset', '*', 'unverified')
    
    def verify_frame(self, frame):
        """Verify current frame against all user subfolders, return matched username or None"""
        verification_base = '/home/nasir/dashboard/application_data/verification_images'
        
        if not os.path.exists(verification_base):
            return None
        
        input_img = preprocess(frame)

        folders_to_check = (
            [self.expected_username] if self.expected_username else os.listdir(verification_base)
        )

        for user_folder in folders_to_check:
            user_path = os.path.join(verification_base, user_folder)
            if not os.path.isdir(user_path):
                continue
            verification_images = [f for f in os.listdir(user_path) if f.endswith('.jpg')]
            if not verification_images:
                continue

            matches = 0
            for val_image in verification_images:
                val_path = os.path.join(user_path, val_image)
                byte_img = tf.io.read_file(val_path)
                img = tf.io.decode_jpeg(byte_img)
                validation_img = preprocess(img)
                result = model.predict(list(np.expand_dims([input_img, validation_img], axis=1)), verbose=0)
                if result[0][0] > 0.5:
                    matches += 1

            score = matches / len(verification_images)
            print(f"User '{user_folder}': {matches}/{len(verification_images)} ({score:.1%})")
            if score > 0.2:
                return user_folder

        return None
    
    def predict_behavior(self, frame):
        """Predict driver behavior using VGG model"""
        img = Image.fromarray(frame).resize((240, 240))
        img_array = np.array(img)
        if img_array.shape[2] == 4:
            img_array = img_array[:, :, :3]
        img_array = np.expand_dims(img_array / 255.0, axis=0)
        predictions = model_VGG.predict(img_array, verbose=0)
        return class_labels[np.argmax(predictions)]
    
    def record_behavior(self, behavior):
        """Record behavior to JSON file and notify Express server if dangerous"""
        score = behavior_scores[behavior]
        record = {
            'username': self.detected_username,
            'behavior': behavior,
            'score': score,
            'timestamp': datetime.now().isoformat()
        }

        # Load existing data
        if os.path.exists(behavior_log_file):
            with open(behavior_log_file, 'r') as f:
                data = json.load(f)
        else:
            data = []

        # Append and save
        data.append(record)
        with open(behavior_log_file, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"✓ Recorded: {behavior} (score: {score}, user: {self.detected_username})")

        # POST alert to Express server for dangerous behaviors
        if behavior in ('Texting', 'Talking', 'Other'):
            def post_alert():
                try:
                    http_requests.post(
                        'http://localhost:5000/api/alerts',
                        json={
                            'username': self.detected_username,
                            'behavior': behavior,
                            'score': score,
                        },
                        timeout=2
                    )
                except Exception:
                    pass
            threading.Thread(target=post_alert, daemon=True).start()
    
    def process_frame(self, frame):
        """Process frame based on current state"""
        with self.lock:
            self.current_frame = frame
            
            if self.state == 'unverified':
                self.start_verify()
            elif self.state == 'verifying':
                matched_user = self.verify_frame(frame)
                if self.state != 'verifying':
                    return self.verified_user  # reset() was called during verify_frame()
                if matched_user:
                    self.verify_success()
                    self.verified_user = True
                    self.detected_username = matched_user
                    print(f"✓ User verified: {matched_user}")
                else:
                    self.verify_fail()
            
            if self.verified_user and self.state == 'verified':
                self.frame_count += 1
                if self.frame_count % 2 == 0:
                    self.current_behavior = self.predict_behavior(frame)
                    
                    # Add to buffer
                    self.behavior_buffer.append(self.current_behavior)
                    if len(self.behavior_buffer) > 5:
                        self.behavior_buffer.pop(0)
                    
                    # Check if last 5 frames have same behavior
                    if len(self.behavior_buffer) == 5 and len(set(self.behavior_buffer)) == 1:
                        if self.current_behavior != self.last_recorded_behavior:
                            self.record_behavior(self.current_behavior)
                            self.last_recorded_behavior = self.current_behavior
            
            return self.verified_user

# Initialize state machine
vsm = VerificationStateMachine()

# Initialize camera
picam2 = Picamera2()
config = picam2.create_video_configuration(
    main={"size": (480, 360), "format": "RGB888"},
    controls={"FrameRate": 10}
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
        
        # Run verification/behavior in background only if previous frame is done
        if not vsm.lock.locked():
            threading.Thread(target=vsm.process_frame, args=(frame.copy(),), daemon=True).start()
        
        # Add verification status overlay
        color = (0, 255, 0) if vsm.verified_user else (0, 0, 255)
        status = f"VERIFIED: {vsm.detected_username}" if vsm.verified_user else "VERIFYING..."
        cv2.putText(frame, status, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
        
        if vsm.verified_user:
            cv2.putText(frame, f"Behavior: {vsm.current_behavior}", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        # Encode frame
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/stream')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/frame')
def single_frame():
    """Return a single JPEG frame for polling-based clients"""
    frame = picam2.capture_array()
    color = (0, 255, 0) if vsm.verified_user else (0, 0, 255)
    status = f"VERIFIED: {vsm.detected_username}" if vsm.verified_user else "VERIFYING..."
    cv2.putText(frame, status, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
    if vsm.verified_user:
        cv2.putText(frame, f"Behavior: {vsm.current_behavior}", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    ret, buffer = cv2.imencode('.jpg', frame)
    return Response(buffer.tobytes(), mimetype='image/jpeg',
                    headers={'Cache-Control': 'no-store'})

@app.route('/verified-user')
def verified_user():
    return {
        'verified': vsm.verified_user,
        'username': vsm.detected_username
    }

@app.route('/status')
def status():
    return {
        'status': 'running',
        'verified': vsm.verified_user,
        'state': vsm.state,
        'behavior': vsm.current_behavior
    }

@app.route('/set-user', methods=['POST'])
def set_user():
    data = request.get_json()
    username = data.get('username', '').strip() if data else ''
    if not username:
        return jsonify({'error': 'username required'}), 400
    pre_verified = bool(data.get('verified', False))
    user_path = f'/home/nasir/dashboard/application_data/verification_images/{username}'
    if not pre_verified and not os.path.isdir(user_path):
        return jsonify({'error': f'No verification images found for user: {username}'}), 404
    vsm.reset()
    vsm.expected_username = username
    vsm.frame_count = 0
    vsm.current_behavior = "Unknown"
    vsm.behavior_buffer = []
    vsm.last_recorded_behavior = None
    if pre_verified:
        vsm.start_verify()
        vsm.verify_success()
        vsm.verified_user = True
        vsm.detected_username = username
        print(f"✓ User pre-verified (password login): {username}")
    else:
        vsm.verified_user = False
        vsm.detected_username = None
        print(f"✓ Expected user set to: {username}")
    return jsonify({'status': 'ok', 'expected_user': username, 'pre_verified': pre_verified})

@app.route('/reset')
def reset():
    vsm.reset()
    vsm.verified_user = False
    vsm.detected_username = None
    vsm.expected_username = None
    vsm.frame_count = 0
    vsm.current_behavior = "Unknown"
    vsm.behavior_buffer = []
    vsm.last_recorded_behavior = None
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
    finally:
        print("\nStopping...")
        picam2.stop()
