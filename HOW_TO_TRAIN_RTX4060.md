# 🐶 Training Your 120-Breed Dog Classifier

This guide explains how to train the **120-breed dog classification model** on your **PC with NVIDIA RTX 4060** (or Google Colab) and connect it to your web application.

---

## ⚡ Option A: Train on Your PC (NVIDIA RTX 4060)

The RTX 4060 has dedicated Tensor Cores and FP16 mixed precision support. The entire training process takes only **3 to 5 minutes**!

### 1. Requirements on your PC
Make sure you have Python 3.10 or 3.11 installed, then open PowerShell / Terminal and run:

```bash
pip install tensorflow[and-cuda] numpy pillow
```
*(Or standard `pip install tensorflow numpy pillow` if CUDA is already configured).*

### 2. Copy the Training Script to your PC
Copy the file `backend/train_stanford_dogs.py` from this project to any folder on your PC.

### 3. Run the Training Script
```bash
python train_stanford_dogs.py
```

### What the script does automatically:
1. Detects your RTX 4060 GPU and enables `mixed_float16` precision.
2. Downloads the Stanford Dogs dataset (~750 MB, 20,580 images across 120 breeds) and extracts it.
3. Automatically trains a MobileNetV2 Transfer Learning model:
   - **Phase 1**: Trains the classification head (8 epochs).
   - **Phase 2**: Fine-tunes the top layers (12 epochs).
4. Saves:
   - `model/dog_breed_120.keras` (or `model/dog_breed_120.h5`)
   - `model/classes.json` (List of all 120 breeds)
   - `model/breed_info.json` (Rich breed traits, temperaments, and sizes)

---

## ☁️ Option B: Train on Google Colab (Free T4 GPU)

If you don't want to configure CUDA on your PC, you can train in Google Colab directly in your browser:

1. Open [Google Colab](https://colab.research.google.com/).
2. Click **New Notebook**.
3. Under **Runtime > Change runtime type**, select **T4 GPU**.
4. In the first code cell, paste the code from [train_stanford_dogs.py](file:///Users/shailajashedthih/Desktop/dog_breed_web%202/backend/train_stanford_dogs.py) and click **Run**.
5. Once complete (~8 minutes), download `dog_breed_120.keras` and `classes.json` from the Colab file explorer on the left.

---

## 🚀 Connecting the Model to Your Web App (on M1 Mac)

Once training finishes:
1. Copy `dog_breed_120.keras` (or `dog_breed_120.h5`) into:
   ```
   backend/model/
   ```
2. Your backend is already updated! When you start Flask:
   ```bash
   python backend/app.py
   ```
   Flask will automatically detect `dog_breed_120.keras` and switch from the 5-breed fallback to the full **120-breed AI engine**.

3. Start your React frontend:
   ```bash
   cd frontend-react
   npm start
   ```
   Your app will now recognize all 120 dog breeds, display their temperament/size/facts, show top alternative matches, and generate exportable PDF reports!
