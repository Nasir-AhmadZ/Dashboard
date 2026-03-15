import tensorflow as tf
from tensorflow.keras.layers import Layer
import numpy as np
import cv2
import os
from picamera2 import Picamera2
import uuid

# L1 Distance Layer
class L1Dist(Layer):
    def __init__(self, **kwargs):
        super().__init__()
    
    def call(self, input_embedding, validation_embedding):
        return tf.math.abs(input_embedding - validation_embedding)

# Preprocessing function
def preprocess(file_path):
    byte_img = tf.io.read_file(file_path)
    img = tf.io.decode_jpeg(byte_img)
    img = tf.image.resize(img, (100, 100))
    img = img / 255.0
    return img

# Create directories if they don't exist
os.makedirs('application_data/verification_images', exist_ok=True)
os.makedirs('application_data/input_image', exist_ok=True)

# Load the model
model = tf.keras.models.load_model('siamesemodelv2.h5', 
                                   custom_objects={'L1Dist': L1Dist, 'BinaryCrossentropy': tf.losses.BinaryCrossentropy})

# Verification function
def verify(model, detection_threshold, verification_threshold):
    results = []
    
    # Use only the most recent input image
    input_img = preprocess(os.path.join('application_data', 'input_image', 'input_image.jpg'))
    
    # Compare against verification images
    for val_image in os.listdir(os.path.join('application_data', 'verification_images')):
        validation_img = preprocess(os.path.join('application_data', 'verification_images', val_image))
        result = model.predict(list(np.expand_dims([input_img, validation_img], axis=1)), verbose=0)
        results.append(result)
    
    detection = np.sum(np.array(results) > detection_threshold)
    verification = detection / len(results)
    verified = verification > verification_threshold
    
    return results, verified

# Initialize camera
picam2 = Picamera2()
config = picam2.create_preview_configuration(main={"format": "XRGB8888", "size": (250, 250)})
picam2.configure(config)
picam2.start()

print("Press 'r' to capture reference/verification image")
print("Press 'v' to verify")
print("Press 'q' to quit")

verification_result = None
verification_score = None

while True:
    frame = picam2.capture_array()
    
    if verification_result is not None:
        status_text = "VERIFIED" if verification_result else "NOT VERIFIED"
        color = (0, 255, 0) if verification_result else (0, 0, 255)
        cv2.putText(frame, status_text, (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        if verification_score is not None:
            cv2.putText(frame, f'Score: {verification_score:.1%}', (10, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    
    cv2.imshow('Verification', frame)
    
    key = cv2.waitKey(1) & 0xFF
    
    # Capture reference/verification image
    if key == ord('r'):
        imgname = os.path.join('application_data', 'verification_images', f'{uuid.uuid1()}.jpg')
        cv2.imwrite(imgname, frame)
        print(f"Reference image saved: {imgname}")
    
    # Verify
    if key == ord('v'):
        verification_count = len(os.listdir('application_data/verification_images'))
        if verification_count > 0:
            cv2.imwrite(os.path.join('application_data', 'input_image', 'input_image.jpg'), frame)
            
            print("\nVerifying...")
            results, verified = verify(model, 0.5, 0.5)
            
            if len(results) > 0:
                detection_count = np.sum(np.array(results) > 0.5)
                verification_score = detection_count / verification_count
                verification_result = detection_count > 10  # Pass if more than 10 matches
                
                print(f'Verified: {verification_result}')
                print(f'Matches: {detection_count} / {verification_count} ({verification_score:.1%})')
            else:
                print("Verification failed - no results")
        else:
            print("No verification images available!")
    
    # Quit
    if key == ord('q'):
        break

cv2.destroyAllWindows()
picam2.stop()
