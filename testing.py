import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models, Input, Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.losses import BinaryCrossentropy
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import os
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from PIL import Image

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

    model_VGG = models.Model(inputs=inp, outputs=x)

    return model_VGG

model_VGG = VGGNet()
model_VGG.summary()

Batch_size = 64
Img_height = 240
Img_width = 240

# Load model
model_VGG.load_weights('/home/nasir/dashboard/cpVGG.weights.h5')

# Dataset path
folddir = '/home/nasir/dashboard/Revitsone-5classes'

# Class labels matching notebook structure
#Appends all the images in other activities folder to this array other_activities
other_activities = []
for otherImg in os.listdir("/home/nasir/dashboard/Revitsone-5classes/other_activities"):
  if otherImg.endswith(".png") or otherImg.endswith(".jpg"):
    other_activities.append(os.path.join("/home/nasir/dashboard/Revitsone-5classes/other_activities",otherImg))

#Appends all the images in safe driving folder to this array safe_driving
safe_driving = []
for safeImg in os.listdir("/home/nasir/dashboard/Revitsone-5classes/safe_driving"):
  if safeImg.endswith(".png") or safeImg.endswith(".jpg"):
    safe_driving.append(os.path.join("/home/nasir/dashboard/Revitsone-5classes/safe_driving",safeImg))

#Append all the images in talking phone to this array talking_phone
talking_phone = []
for talkingImg in os.listdir("/home/nasir/dashboard/Revitsone-5classes/talking_phone"):
  if talkingImg.endswith(".png") or talkingImg.endswith(".jpg"):
    talking_phone.append(os.path.join("/home/nasir/dashboard/Revitsone-5classes/talking_phone",talkingImg))

#Append all the images in texting phone to this array texting_phone
texting_phone = []
for textingImg in os.listdir("/home/nasir/dashboard/Revitsone-5classes/texting_phone"):
  if textingImg.endswith(".png") or textingImg.endswith(".jpg"):
    texting_phone.append(os.path.join("/home/nasir/dashboard/Revitsone-5classes/texting_phone",textingImg))

#Append all the images in turning folder to this array turning
turning = []
for turningImg in os.listdir("/home/nasir/dashboard/Revitsone-5classes/turning"):
  if turningImg.endswith(".png") or turningImg.endswith(".jpg"):
    turning.append(os.path.join("/home/nasir/dashboard/Revitsone-5classes/turning",turningImg))


print("Number of samples in (Class = Other) = " ,len(other_activities))
print("Number of samples in (Class = Safe Driving) = " ,len(safe_driving))
print("Number of samples in (Class = Talking Phone) = " ,len(talking_phone))
print("Number of samples in (Class = Texting Phone) = " ,len(texting_phone))
print("Number of samples in (Class = Turning) = " ,len(turning))


train_other_df = pd.DataFrame({'image':other_activities,'label':'Other'})
train_safe_df = pd.DataFrame({'image':safe_driving,'label':'Safe'})
train_talking_df = pd.DataFrame({'image':talking_phone,'label':'Talking'})
train_texting_df = pd.DataFrame({'image':texting_phone,'label':'Texting'})
train_turn_df = pd.DataFrame({'image':turning,'label':'Turn'})

train_df = pd.concat([train_other_df, train_safe_df, train_talking_df, train_texting_df, train_turn_df])

trainGenerator = ImageDataGenerator(rescale=1./255.)

trainDataset = trainGenerator.flow_from_dataframe(
  dataframe=train_df,
  class_mode="categorical",
  x_col="image",
  y_col="label",
  batch_size=Batch_size,
  seed=42,
  shuffle=True,
  target_size=(Img_height,Img_width) #set the height and width of the images
)

# Test model
correct = 0

img_path = '/home/nasir/dashboard/Revitsone-5classes/talking_phone/img_10324.jpg'


# Load the image
img = Image.open(img_path)

# Resize the image to match the model's expected input size
img = img.resize((240, 240))

# Convert the image to a NumPy array
img_array = np.array(img)

# Convert RGBA to RGB if needed
if img_array.shape[2] == 4:
    img_array = img_array[:, :, :3]

# Normalize the pixel values to the range [0, 1]
img_array = img_array / 255.0

# Add a batch dimension to the image array
img_array = np.expand_dims(img_array, axis=0)

# Get prediction from the model
predictions = model_VGG.predict(img_array)

# The model outputs probabilities for each class, Find the class with the highest probability
predicted_class_index = np.argmax(predictions)
predicted_class_probability = np.max(predictions)

# Get the class labels from your ImageDataGenerator (they are in alphabetical order by default)
# You might need to adjust this if your labels were ordered differently
class_labels = sorted(trainDataset.class_indices.keys())
predicted_class_label = class_labels[predicted_class_index]

print(f"Predictions: {predictions}")
print(f"Predicted class index: {predicted_class_index}")
print(f"Predicted class: {predicted_class_label} with probability {predicted_class_probability:.2f}")

# Optionally, display the image
plt.imshow(img)
plt.title(f"Predicted: {predicted_class_label}")
plt.axis('off')
plt.show()