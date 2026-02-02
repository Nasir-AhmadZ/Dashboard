#!/usr/bin/env python3
"""
Raspberry Pi Camera Module 3 Streaming Server
Streams camera feed via HTTP using picamera2
"""

from flask import Flask, Response
from picamera2 import Picamera2
from picamera2.encoders import JpegEncoder
from picamera2.outputs import FileOutput
import io
import threading
import time

app = Flask(__name__)

# Initialize camera
picam2 = Picamera2()

# Configure camera for streaming
# Using a lower resolution for better performance
config = picam2.create_video_configuration(
    main={"size": (1280, 720), "format": "RGB888"},
    controls={"FrameRate": 30}
)
picam2.configure(config)

class StreamingOutput(io.BufferedIOBase):
    def __init__(self):
        self.frame = None
        self.condition = threading.Condition()

    def write(self, buf):
        with self.condition:
            self.frame = buf
            self.condition.notify_all()

output = StreamingOutput()

def generate_frames():
    """Generator function to yield frames for streaming"""
    while True:
        with output.condition:
            output.condition.wait()
            frame = output.frame
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/stream')
def video_feed():
    """Video streaming route"""
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/status')
def status():
    """Health check endpoint"""
    return {'status': 'running', 'camera': 'active'}

@app.route('/')
def index():
    """Simple index page"""
    return '''
    <html>
        <head>
            <title>Camera Stream</title>
        </head>
        <body>
            <h1>Raspberry Pi Camera Stream</h1>
            <img src="/stream" width="100%">
        </body>
    </html>
    '''

if __name__ == '__main__':
    print("Starting Raspberry Pi Camera Module 3 streaming server...")
    print("Camera configuration:", config)
    
    # Start camera
    picam2.start()
    time.sleep(2)  # Let camera warm up
    
    # Start recording to output
    encoder = JpegEncoder()
    picam2.start_recording(encoder, FileOutput(output))
    
    print("Camera started successfully!")
    print("Stream available at: http://localhost:8080/stream")
    print("Press Ctrl+C to stop")
    
    try:
        app.run(host='0.0.0.0', port=8080, threaded=True)
    except KeyboardInterrupt:
        print("\nStopping camera...")
        picam2.stop_recording()
        picam2.stop()
        print("Camera stopped.")
