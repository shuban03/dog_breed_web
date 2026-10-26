# 🌐 How to Host CanineAI (Permanent & Free Cloud Deployment)

Your CanineAI website is already **live right now** via Cloudflare Tunnel:
👉 **Live URL:** [https://workout-breath-sustainability-accommodations.trycloudflare.com](https://workout-breath-sustainability-accommodations.trycloudflare.com)

If you want **24/7 permanent hosting in the cloud** (so it stays online even when your computer is shut down), follow either of these two free methods:

---

## Option 1: Deploy on Render.com (Recommended — 100% Free)

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial CanineAI deployment"
   # Create a repo on github.com, then:
   git branch -M main
   git remote add origin https://github.com/<your-username>/dog_breed_web.git
   git push -u origin main
   ```
   *(Note: Ensure `backend/model/dog_breed_120.keras` is tracked via Git LFS or committed if under 100MB; it is ~43MB so standard Git push works fine!)*

2. **Go to [render.com](https://render.com) and sign in.**
3. Click **New +** -> **Web Service**.
4. Select your GitHub repository.
5. Configure:
   - **Name:** `canine-ai`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python backend/app.py`
   - **Plan:** `Free`
6. Click **Create Web Service**. Render will deploy your app and give you a permanent `https://canine-ai.onrender.com` URL with free SSL!

---

## Option 2: Deploy on Railway.app

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select this repository.
4. Railway will automatically detect the `Procfile` and deploy your app.
5. In project settings, click **Generate Domain** to get a permanent URL (e.g. `https://canine-ai.up.railway.app`).

---

## Option 3: Local Network (Access from your phone on home Wi-Fi)

Your Mac and phone only need to be on the same Wi-Fi network:
1. Open your phone's browser (Safari or Chrome).
2. Type in your Mac's local IP address:
   👉 **`http://10.85.255.141:5001`**
