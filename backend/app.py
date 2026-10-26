import os
import json
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import tensorflow as tf

app = Flask(__name__, static_folder="../frontend-react/build")
CORS(app, resources={r"/*": {"origins": "*"}})

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.errorhandler(400)
def handle_bad_request(e):
    import traceback
    print(f"\n💥 400 BAD REQUEST TRIGGERED: {e}", flush=True)
    traceback.print_exc()
    return jsonify({"error": f"Bad request: {str(e)}"}), 400

@app.errorhandler(Exception)
def handle_all_exceptions(e):
    import traceback
    print(f"\n💥 SERVER EXCEPTION TRIGGERED: {e}", flush=True)
    traceback.print_exc()
    return jsonify({"error": f"Server error: {str(e)}"}), 500

# Base paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")

MODEL_120_KERAS = os.path.join(MODEL_DIR, "dog_breed_120.keras")
MODEL_120_H5 = os.path.join(MODEL_DIR, "dog_breed_120.h5")
MODEL_5_H5 = os.path.join(MODEL_DIR, "dog_breed_mobilenet_5breeds.h5")

import certifi
os.environ['SSL_CERT_FILE'] = certifi.where()

CLASSES_FILE = os.path.join(MODEL_DIR, "classes.json")
BREED_INFO_FILE = os.path.join(MODEL_DIR, "breed_info.json")
IMAGENET_CLASS_FILE = os.path.join(MODEL_DIR, "imagenet_class_index.json")

# Default 5-breed fallback list
DEFAULT_5_CLASSES = [
    "beagle",
    "basset_hound",
    "pug",
    "pomeranian",
    "samoyed"
]

# Load Breed Information Database
BREED_INFO = {}
if os.path.exists(BREED_INFO_FILE):
    try:
        with open(BREED_INFO_FILE, "r") as f:
            BREED_INFO = json.load(f)
        print(f"✅ Loaded breed info database with {len(BREED_INFO)} breeds.", flush=True)
    except Exception as e:
        print("Warning: could not load breed_info.json:", e, flush=True)

# Load ImageNet Dog Synsets for Dog vs Non-Dog Validation
DOG_SYNSETS = set()
if os.path.exists(IMAGENET_CLASS_FILE):
    try:
        with open(IMAGENET_CLASS_FILE, "r") as f:
            idx_map = json.load(f)
        for idx, (synset, name) in idx_map.items():
            # ImageNet domestic dog and wild canine classes (151 to 275)
            if 151 <= int(idx) <= 275:
                DOG_SYNSETS.add(synset)
        print(f"✅ Loaded {len(DOG_SYNSETS)} canine reference synsets.", flush=True)
    except Exception as e:
        print("Warning loading imagenet_class_index.json:", e, flush=True)

# Canine Validator Model (ImageNet MobileNetV2)
print("Loading Canine Validator (Dog vs Non-Dog Vision Model)...", flush=True)
validator_model = tf.keras.applications.MobileNetV2(weights="imagenet")
print("✅ Canine Validator Model Online!", flush=True)

# Determine which breed classifier model to load
model = None
ACTIVE_MODEL_NAME = "none"
CLASS_NAMES = DEFAULT_5_CLASSES

if os.path.exists(MODEL_120_KERAS):
    print(f"Loading 120-breed model from {MODEL_120_KERAS}...", flush=True)
    model = tf.keras.models.load_model(MODEL_120_KERAS, compile=False)
    ACTIVE_MODEL_NAME = "120_breeds_keras"
    if os.path.exists(CLASSES_FILE):
        with open(CLASSES_FILE, "r") as f:
            CLASS_NAMES = json.load(f)
elif os.path.exists(MODEL_120_H5):
    print(f"Loading 120-breed model from {MODEL_120_H5}...", flush=True)
    model = tf.keras.models.load_model(MODEL_120_H5, compile=False)
    ACTIVE_MODEL_NAME = "120_breeds_h5"
    if os.path.exists(CLASSES_FILE):
        with open(CLASSES_FILE, "r") as f:
            CLASS_NAMES = json.load(f)
elif os.path.exists(MODEL_5_H5):
    print(f"Loading fallback 5-breed model from {MODEL_5_H5}...", flush=True)
    model = tf.keras.models.load_model(MODEL_5_H5, compile=False)
    ACTIVE_MODEL_NAME = "5_breeds_fallback"
    CLASS_NAMES = DEFAULT_5_CLASSES
else:
    print("⚠️ No model file found in model/ directory!", flush=True)

print(f"✅ Active Breed Classifier: {ACTIVE_MODEL_NAME} ({len(CLASS_NAMES)} classes)", flush=True)

def check_is_dog_image(pil_img):
    """
    Validates if the image contains a dog versus a human, vehicle, or everyday object.
    Uses MobileNetV2 ImageNet-1k multi-class validation.
    """
    try:
        val_img = pil_img.resize((224, 224))
        arr = tf.keras.applications.mobilenet_v2.preprocess_input(
            np.expand_dims(np.array(val_img, dtype=np.float32), 0)
        )
        val_preds = validator_model.predict(arr, verbose=0)
        decoded = tf.keras.applications.mobilenet_v2.decode_predictions(val_preds, top=5)[0]
        
        dog_score = sum(score for synset, name, score in decoded if synset in DOG_SYNSETS)
        top_synset, top_name, top_score = decoded[0]
        
        is_dog = (top_synset in DOG_SYNSETS) or (dog_score >= 0.15)
        detected_entity = top_name.replace("_", " ").title()
        
        return is_dog, dog_score, detected_entity
    except Exception as e:
        print("Warning during dog verification:", e, flush=True)
        return True, 1.0, "Dog"

def get_breed_metadata(breed_key):
    """Retrieve or construct rich metadata for a given breed."""
    info = BREED_INFO.get(breed_key)
    if not info:
        display = breed_key.replace("_", " ").title()
        info = {
            "display_name": display,
            "description": f"The {display} is a recognized dog breed with distinct physical and behavioral characteristics.",
            "temperament": "Loyal, Active, Intelligent",
            "size": "Medium",
            "life_expectancy": "10 - 14 years",
            "origin": "International",
            "energy_level": "Moderate"
        }
    return info

# ---------- FRONTEND ROUTES ----------

@app.route("/")
def home():
    if os.path.exists("../frontend-react/build/index.html"):
        return send_from_directory("../frontend-react/build", "index.html")
    return send_from_directory("../frontend", "index.html")

@app.route("/<path:path>")
def static_files(path):
    if os.path.exists(os.path.join("../frontend-react/build", path)):
        return send_from_directory("../frontend-react/build", path)
    return send_from_directory("../frontend", path)

# ---------- API ROUTES ----------

@app.route("/api/status", methods=["GET"])
def get_status():
    return jsonify({
        "status": "online",
        "active_model": ACTIVE_MODEL_NAME,
        "breed_count": len(CLASS_NAMES),
        "is_120_breeds": len(CLASS_NAMES) >= 120
    })

def get_breed_metadata(breed_key):
    """Retrieve or construct rich metadata for a given breed."""
    # Ensure freshly loaded or fallback
    if not BREED_INFO and os.path.exists(BREED_INFO_FILE):
        try:
            with open(BREED_INFO_FILE, "r") as f:
                BREED_INFO.update(json.load(f))
        except Exception:
            pass

    info = BREED_INFO.get(breed_key)
    if not info:
        display = breed_key.replace("_", " ").title()
        info = {
            "display_name": display,
            "akc_group": "Companion",
            "origin": "International 🌍",
            "size": "Medium",
            "weight_lbs": "30 - 50 lbs",
            "life_expectancy": "10 - 14 years",
            "temperament": "Loyal, Active, Intelligent",
            "description": f"The {display} is a recognized dog breed with distinct physical and behavioral characteristics.",
            "energy": 3,
            "trainability": 4,
            "kid_friendly": 4,
            "apartment_friendly": 3,
            "grooming": 3,
            "fun_fact": f"The {display} has a long history registered across international canine clubs.",
            "lookalike": {
                "name": "Similar Breeds",
                "tip": "Observe ear structure, tail posture, and coat textures."
            }
        }
    return info

@app.route("/api/breeds", methods=["GET"])
def list_breeds():
    breeds_list = []
    for breed in CLASS_NAMES:
        info = get_breed_metadata(breed)
        breeds_list.append({
            "key": breed,
            "display_name": info.get("display_name", breed.replace("_", " ").title()),
            "akc_group": info.get("akc_group", "Companion"),
            "origin": info.get("origin", "International 🌍"),
            "size": info.get("size", "Medium"),
            "weight_lbs": info.get("weight_lbs", "30 - 50 lbs"),
            "life_expectancy": info.get("life_expectancy", "10 - 14 years"),
            "temperament": info.get("temperament", "Friendly, Alert"),
            "description": info.get("description", ""),
            "fun_fact": info.get("fun_fact", ""),
            "energy": info.get("energy", 3),
            "trainability": info.get("trainability", 4),
            "kid_friendly": info.get("kid_friendly", 4),
            "apartment_friendly": info.get("apartment_friendly", 3),
            "grooming": info.get("grooming", 3),
            "lookalike": info.get("lookalike", {})
        })
    return jsonify({
        "total": len(breeds_list),
        "breeds": breeds_list
    })

@app.route("/predict", methods=["POST"])
def predict():
    print(f"\n📥 Received /predict POST request. Headers: {dict(request.headers)}", flush=True)
    
    if model is None:
        print("❌ Error: No model loaded on server", flush=True)
        return jsonify({"error": "No model loaded on server"}), 500

    file = None
    try:
        print(f"📦 request.files keys: {list(request.files.keys())}", flush=True)
        print(f"📦 request.form keys: {list(request.form.keys())}", flush=True)
        if "image" in request.files:
            file = request.files["image"]
        elif "file" in request.files:
            file = request.files["file"]
        elif len(request.files) > 0:
            file = list(request.files.values())[0]
    except Exception as e:
        import traceback
        print(f"💥 Exception reading request.files: {e}", flush=True)
        traceback.print_exc()
        return jsonify({"error": f"Failed to parse upload: {str(e)}"}), 400

    if file is None or getattr(file, "filename", "") == "":
        print(f"❌ Error: No image file provided or filename empty. file={file}", flush=True)
        return jsonify({"error": "No image file provided in request"}), 400

    print(f"📷 Processing uploaded file: {file.filename}, content_type: {file.content_type}", flush=True)
    try:
        img = Image.open(file.stream if hasattr(file, 'stream') else file).convert("RGB")
    except Exception as e:
        print(f"❌ Error decoding image: {e}", flush=True)
        return jsonify({"error": f"Invalid image format: {str(e)}"}), 400

    # 1. CANINE VALIDATION: Verify if image actually contains a dog vs human, car, or object
    is_dog, dog_score, detected_entity = check_is_dog_image(img)
    if not is_dog:
        print(f"🚫 Non-dog image rejected! Detected entity: {detected_entity} (dog score: {dog_score*100:.1f}%)", flush=True)
        return jsonify({
            "is_dog": False,
            "error": f"No dog detected in this photo. The vision system detected: {detected_entity}. Please upload a clear photo of a dog.",
            "detected_object": detected_entity,
            "dog_confidence": round(dog_score * 100, 2)
        }), 200

    try:
        # Resize to 224x224 for 120-breed classification
        img_resized = img.resize((224, 224))
        img_array = np.array(img_resized, dtype=np.float32)
        
        # The 120-breed model has MobileNetV2's preprocess_input built into its architecture
        # and expects [0, 255] float32 pixels. The legacy 5-breed fallback expects [0, 1] range.
        if ACTIVE_MODEL_NAME == "5_breeds_fallback":
            img_array = img_array / 255.0

        img_array = np.expand_dims(img_array, axis=0)

        preds = model.predict(img_array, verbose=0)[0]
        top_indices = np.argsort(preds)[::-1][:5]
        
        top_idx = int(top_indices[0])
        breed_key = CLASS_NAMES[top_idx] if top_idx < len(CLASS_NAMES) else f"Breed_{top_idx}"
        confidence = float(preds[top_idx]) * 100

        top_meta = get_breed_metadata(breed_key)

        # Build Top-5 predictions list
        top_5 = []
        for idx in top_indices:
            b_key = CLASS_NAMES[int(idx)] if int(idx) < len(CLASS_NAMES) else f"Breed_{idx}"
            b_meta = get_breed_metadata(b_key)
            top_5.append({
                "breed": b_key,
                "display_name": b_meta.get("display_name", b_key.replace("_", " ").title()),
                "confidence": round(float(preds[int(idx)]) * 100, 2)
            })

        return jsonify({
            "is_dog": True,
            "breed": breed_key,
            "display_name": top_meta.get("display_name", breed_key.replace("_", " ").title()),
            "confidence": round(confidence, 2),
            "info": top_meta,
            "description": top_meta.get("description", ""),
            "top_5": top_5,
            "active_model": ACTIVE_MODEL_NAME,
            "total_classes": len(CLASS_NAMES)
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Inference error: {str(e)}"}), 500

# ---------- RUN SERVER ----------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"🚀 CanineAI Backend Server running on http://0.0.0.0:{port}", flush=True)
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
