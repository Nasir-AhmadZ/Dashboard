import tensorflow as tf
from tensorflow.keras import layers, models
import numpy as np
from PIL import Image
import sys

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

model = VGGNet()
model.load_weights('/home/nasir/dashboard/cpVGG.weights.h5')
class_labels = ['Other', 'Safe', 'Talking', 'Texting', 'Turn']

img_path = sys.argv[1] if len(sys.argv) > 1 else '/home/nasir/dashboard/Revitsone-5classes/texting_phone/2019-04-2417-17-20.png'

img = Image.open(img_path).resize((240, 240))
img_array = np.array(img)
if img_array.shape[2] == 4:
    img_array = img_array[:, :, :3]
img_array = np.expand_dims(img_array / 255.0, axis=0)

predictions = model.predict(img_array, verbose=0)
print(f"{class_labels[np.argmax(predictions)]} ({np.max(predictions):.2%})")
