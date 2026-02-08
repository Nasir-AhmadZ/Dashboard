#!/usr/bin/env python3
from flask import Flask, Response, render_template_string
from flask_cors import CORS
import cv2
from picamera2 import Picamera2
import time

app = Flask(__name__)
CORS(app)
picam2 = None

def init_camera():
    global picam2
    try:
        picam2 = Picamera2()
        config = picam2.create_video_configuration(
            main={"size": (1280, 720), "format": "RGB888"}
        )
        picam2.configure(config)
        picam2.start()
        time.sleep(2)
        return True
    except Exception as e:
        print(f"Failed to initialize camera: {e}")
        return False

def generate_frames():
    global picam2
    if picam2 is None:
        yield b''
        return
    while True:
        try:
            frame = picam2.capture_array()
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            if not ret:
                continue
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(0.1)
            continue

@app.route('/stream')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/status')
def status():
    return {'status': 'running', 'camera': 'active' if picam2 else 'inactive'}

@app.route('/')
def index():
    html = '''<!DOCTYPE html><html><head><title>Pi Camera Stream</title><style>body{font-family:Arial;text-align:center;background:#1a1a1a;color:white;padding:20px}img{max-width:90%;border:2px solid #333;border-radius:8px}h1{color:#4CAF50}</style></head><body><h1>Raspberry Pi Camera Stream</h1><p>Live feed</p><img src="/stream" alt="Camera Stream"></body></html>'''
    return render_template_string(html)

if __name__ == '__main__':
    if init_camera():
        try:
            app.run(host='0.0.0.0', port=8080, threaded=True, debug=False)
        except KeyboardInterrupt:
            pass
        finally:
            if picam2:
                picam2.stop()