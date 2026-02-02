#!/usr/bin/env python3
"""
Simple Raspberry Pi Camera Module 3 Streaming Server
Uses Flask and picamera2 for easy setup
"""

from flask import Flask, Response, render_template_string
from flask_cors import CORS
import cv2
from picamera2 import Picamera2
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Initialize Picamera2
picam2 = None

def init_camera():
    global picam2
    try:
        picam2 = Picamera2()
        # Configure for video with reasonable resolution
        config = picam2.create_video_configuration(
            main={"size": (1280, 720), "format": "RGB888"}
        )
        picam2.configure(config)
        picam2.start()
        time.sleep(2)  # Camera warm-up
        print("✓ Camera initialized successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to initialize camera: {e}")
        return False

def generate_frames():
    """Generate frames from camera"""
    global picam2
    
    if picam2 is None:
        yield b''
        return
    
    while True:
        try:
            # Capture frame
            frame = picam2.capture_array()
            
            # Encode frame as JPEG
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            
            if not ret:
                continue
            
            frame_bytes = buffer.tobytes()
            
            # Yield frame in multipart format
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
        except Exception as e:
            print(f"Error generating frame: {e}")
            time.sleep(0.1)
            continue

@app.route('/stream')
def video_feed():
    """Video streaming route"""
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/status')
def status():
    """Health check"""
    return {
        'status': 'running',
        'camera': 'active' if picam2 else 'inactive'
    }

@app.route('/')
def index():
    """Test page"""
    html = '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Pi Camera Stream</title>
        <style>
            body { 
                font-family: Arial; 
                text-align: center; 
                background: #1a1a1a; 
                color: white;
                padding: 20px;
            }
            img { 
                max-width: 90%; 
                border: 2px solid #333;
                border-radius: 8px;
            }
            h1 { color: #4CAF50; }
        </style>
    </head>
    <body>
        <h1>🎥 Raspberry Pi Camera Module 3 Stream</h1>
        <p>Live feed from your camera</p>
        <img src="/stream" alt="Camera Stream">
    </body>
    </html>
    '''
    return render_template_string(html)

if __name__ == '__main__':
    print("=" * 50)
    print("Raspberry Pi Camera Module 3 Streaming Server")
    print("=" * 50)
    
    if init_camera():
        print("\n🚀 Starting server on http://0.0.0.0:8080")
        print("   Local access: http://localhost:8080")
        print("   Stream URL: http://localhost:8080/stream")
        print("\nPress Ctrl+C to stop\n")
        
        try:
            app.run(host='0.0.0.0', port=8080, threaded=True, debug=False)
        except KeyboardInterrupt:
            print("\n\n⏹  Stopping server...")
        finally:
            if picam2:
                picam2.stop()
                print("✓ Camera stopped")
    else:
        print("\n✗ Failed to start camera server")
        print("Make sure:")
        print("  1. Camera is properly connected")
        print("  2. Camera is enabled in raspi-config")
        print("  3. Required packages are installed:")
        print("     sudo apt install -y python3-picamera2 python3-opencv")
        print("     pip3 install flask flask-cors")
