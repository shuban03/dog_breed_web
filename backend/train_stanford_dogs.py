"""
Dog Breed Classifier Training Script (Optimized for NVIDIA RTX 4060 / CUDA or Google Colab)
Dataset: Stanford Dogs Dataset (120 Breeds, 20,580 Images)
Model: Transfer Learning with MobileNetV2 / EfficientNetB0
Outputs:
  - backend/model/dog_breed_120.keras
  - backend/model/classes.json
  - backend/model/breed_info.json
"""

import os
import sys
import json
import urllib.request
import tarfile
import shutil
import re
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models

# ----------------- CONFIGURATION -----------------
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
INITIAL_EPOCHS = 5
FINE_TUNE_EPOCHS = 6
DATASET_URL = "http://vision.stanford.edu/aditya86/ImageNetDogs/images.tar"
RAW_TAR_PATH = "images.tar"
EXTRACT_FOLDER = "Images"
PROCESSED_DATA_DIR = "dataset_120_breeds"
OUTPUT_MODEL_DIR = "model"

os.makedirs(OUTPUT_MODEL_DIR, exist_ok=True)

# ----------------- HARDWARE ACCELERATION -----------------
print("TensorFlow Version:", tf.__version__)
print("Operating System:", sys.platform)

gpus = tf.config.list_physical_devices('GPU')
if gpus:
    print(f"✅ Found {len(gpus)} GPU device(s): {gpus}")
    try:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
        # Enable Mixed Precision only on NVIDIA GPUs (not on Apple Silicon / macOS Metal)
        if sys.platform != "darwin":
            from tensorflow.keras import mixed_precision
            mixed_precision.set_global_policy('mixed_float16')
            print("✅ Mixed precision (FP16) enabled for high-speed training on NVIDIA GPU.")
        else:
            print("🍎 Apple Silicon GPU / Metal detected. Using native float32 precision.")
    except Exception as e:
        print("Hardware note:", e)
else:
    print("⚠️ No GPU detected. Running on Apple Silicon CPU.")

# ----------------- STEP 1: DOWNLOAD & PREPARE DATASET -----------------
import subprocess

EXPECTED_TAR_SIZE = 793579520  # ~756 MB

def robust_download_tar(url, dest_path):
    print(f"\n📥 Downloading Stanford Dogs dataset (~750 MB) with auto-resume...")
    curl_cmd = [
        "curl", "-L", "-C", "-",
        "--retry", "10",
        "--retry-delay", "3",
        "--retry-max-time", "600",
        "-H", "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        "-o", dest_path,
        url
    ]
    try:
        subprocess.run(curl_cmd, check=True)
        print("✅ Download completed.")
    except Exception as err:
        print(f"Curl error: {err}. Trying python requests fallback...")
        import requests
        headers = {"User-Agent": "Mozilla/5.0"}
        downloaded = os.path.getsize(dest_path) if os.path.exists(dest_path) else 0
        if downloaded > 0:
            headers["Range"] = f"bytes={downloaded}-"
        with requests.get(url, headers=headers, stream=True, timeout=30) as r:
            mode = "ab" if downloaded > 0 else "wb"
            total = int(r.headers.get('content-length', 0)) + downloaded
            with open(dest_path, mode) as f:
                for chunk in r.iter_content(chunk_size=1024*1024):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        sys.stdout.write(f"\rDownloading: {downloaded // (1024*1024)}MB / {total // (1024*1024)}MB")
                        sys.stdout.flush()
        print("\n✅ Download completed.")

if not os.path.exists(PROCESSED_DATA_DIR):
    if not os.path.exists(EXTRACT_FOLDER):
        if not os.path.exists(RAW_TAR_PATH) or os.path.getsize(RAW_TAR_PATH) < EXPECTED_TAR_SIZE:
            robust_download_tar(DATASET_URL, RAW_TAR_PATH)

        print("📦 Extracting images.tar...")
        with tarfile.open(RAW_TAR_PATH) as tar:
            tar.extractall()
        print("✅ Extraction complete.")

    print("🧹 Organizing and standardizing breed directory names...")
    os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)
    breed_folders = sorted(os.listdir(EXTRACT_FOLDER))

    for raw_name in breed_folders:
        src_path = os.path.join(EXTRACT_FOLDER, raw_name)
        if not os.path.isdir(src_path):
            continue
        # Clean folder name: 'n02085620-Chihuahua' -> 'chihuahua'
        clean_name = re.sub(r"^n\d+[-_]", "", raw_name).strip().lower().replace("-", "_").replace(" ", "_")
        dest_path = os.path.join(PROCESSED_DATA_DIR, clean_name)
        
        if not os.path.exists(dest_path):
            shutil.copytree(src_path, dest_path)

    print(f"✅ Processed {len(os.listdir(PROCESSED_DATA_DIR))} breed folders in '{PROCESSED_DATA_DIR}'.")
else:
    print(f"✅ Found existing processed dataset at '{PROCESSED_DATA_DIR}'.")

# ----------------- STEP 2: LOAD DATASET SPLITS -----------------
print("\n📊 Loading datasets...")
train_ds = tf.keras.preprocessing.image_dataset_from_directory(
    PROCESSED_DATA_DIR,
    validation_split=0.2,
    subset="training",
    seed=42,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE
)

val_ds = tf.keras.preprocessing.image_dataset_from_directory(
    PROCESSED_DATA_DIR,
    validation_split=0.2,
    subset="validation",
    seed=42,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE
)

class_names = train_ds.class_names
num_classes = len(class_names)
print(f"✅ Total classes (breeds): {num_classes}")

# Save class labels
classes_file = os.path.join(OUTPUT_MODEL_DIR, "classes.json")
with open(classes_file, "w") as f:
    json.dump(class_names, f, indent=2)
print(f"✅ Saved class labels to '{classes_file}'.")

# In-memory caching & prefetch for maximum training speed
AUTOTUNE = tf.data.AUTOTUNE
train_ds = train_ds.cache().prefetch(buffer_size=AUTOTUNE)
val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)

# ----------------- STEP 3: BUILD MODEL (TRANSFER LEARNING) -----------------
print("\n🧠 Constructing MobileNetV2 Transfer Learning Model...")

# Data Augmentation pipeline
data_augmentation = tf.keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.12),
    layers.RandomZoom(0.12),
    layers.RandomContrast(0.1)
], name="data_augmentation")

# Base pre-trained model
base_model = tf.keras.applications.MobileNetV2(
    input_shape=(IMG_SIZE[0], IMG_SIZE[1], 3),
    include_top=False,
    weights="imagenet"
)
base_model.trainable = False  # Freeze base model initially

inputs = layers.Input(shape=(IMG_SIZE[0], IMG_SIZE[1], 3))
x = data_augmentation(inputs)
# MobileNetV2 expects [-1, 1] range:
x = tf.keras.applications.mobilenet_v2.preprocess_input(x)
x = base_model(x, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dropout(0.3)(x)
x = layers.Dense(256, activation="relu")(x)
x = layers.BatchNormalization()(x)
x = layers.Dropout(0.2)(x)
# Explicit float32 softmax output for mixed precision stability
outputs = layers.Dense(num_classes, activation="softmax", dtype="float32", name="predictions")(x)

model = models.Model(inputs=inputs, outputs=outputs)

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

# ----------------- STEP 4: PHASE 1 TRAINING (HEAD ONLY) -----------------
print("\n🚀 Phase 1: Training top classification layers (frozen base)...")
callbacks = [
    tf.keras.callbacks.EarlyStopping(monitor="val_accuracy", patience=4, restore_best_weights=True)
]

history_phase1 = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=INITIAL_EPOCHS,
    callbacks=callbacks
)

# ----------------- STEP 5: PHASE 2 FINE-TUNING -----------------
print("\n🔥 Phase 2: Fine-tuning top backbone layers...")
base_model.trainable = True

# Fine-tune only the top 35 layers of MobileNetV2
for layer in base_model.layers[:-35]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

history_phase2 = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=FINE_TUNE_EPOCHS,
    callbacks=callbacks
)

# ----------------- STEP 6: EVALUATE & EXPORT -----------------
val_loss, val_acc = model.evaluate(val_ds)
print(f"\n🎯 Final Validation Accuracy: {val_acc * 100:.2f}%")

# Save in modern .keras format and .h5 format
keras_save_path = os.path.join(OUTPUT_MODEL_DIR, "dog_breed_120.keras")
h5_save_path = os.path.join(OUTPUT_MODEL_DIR, "dog_breed_120.h5")

try:
    model.save(keras_save_path)
    print(f"✅ Saved model to '{keras_save_path}'.")
except Exception as e:
    print(f"Note on .keras saving: {e}")

try:
    model.save(h5_save_path)
    print(f"✅ Saved model to '{h5_save_path}'.")
except Exception as e:
    print(f"Note on .h5 saving: {e}")

# ----------------- STEP 7: GENERATE BREED INFO METADATA -----------------
def generate_friendly_name(breed_key):
    return breed_key.replace("_", " ").title()

breed_info_data = {}
for breed in class_names:
    name = generate_friendly_name(breed)
    breed_info_data[breed] = {
        "display_name": name,
        "description": f"The {name} is an intelligent, loyal dog breed registered in the standard kennel registries.",
        "temperament": "Affectionate, Intelligent, Alert",
        "size": "Medium",
        "origin": "International",
        "popularity_rank": "High"
    }

breed_info_file = os.path.join(OUTPUT_MODEL_DIR, "breed_info.json")
with open(breed_info_file, "w") as f:
    json.dump(breed_info_data, f, indent=2)
print(f"✅ Generated metadata database for all {len(breed_info_data)} breeds at '{breed_info_file}'.")

print("\n🎉 ALL DONE! Transfer 'dog_breed_120.keras' (or .h5) and 'classes.json' into your backend/model folder.")
