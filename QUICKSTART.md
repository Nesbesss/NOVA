# 🚀 Quick Start Guide

## Three Ways to Run Minplay

### 1️⃣ Super Easy (Docker) 🐳
```bash
./docker-run.sh
# OR
docker-compose up -d
```
✅ Everything runs in one container  
✅ No setup required  
✅ Works on any OS  

**Access:** http://localhost:5173

---

### 2️⃣ Development Mode 🛠️
```bash
# Terminal 1 - Frontend
npm install
npm run dev

# Terminal 2 - Backend (for YouTube Music)
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python app.py
```
✅ Hot reload for development  
✅ Better for coding/debugging  

**Access:** http://127.0.0.1:5173

---

### 3️⃣ Spotify Only (No Backend)
```bash
npm install
npm run dev
```
✅ Quickest setup  
✅ Requires Spotify Premium  
⚠️ No YouTube Music  

**Access:** http://127.0.0.1:5173

---

## Docker Commands Cheat Sheet

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Rebuild
docker-compose up -d --build

# Check status
docker-compose ps

# Remove everything
docker-compose down -v
```

---

## Environment Variables

Create `.env.local`:
```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
VITE_REDIRECT_URI=http://127.0.0.1:5173
VITE_BACKEND_URL=http://localhost:5001
VITE_USE_YTMUSIC=true
```

---

## Features at a Glance

| Feature | Spotify Mode | YouTube Music Mode |
|---------|-------------|-------------------|
| **Cost** | Premium Required | 100% Free |
| **Ads** | No ads | No ads |
| **Login** | Required | Not required |
| **Quality** | High | High |
| **Background Play** | ✅ | ✅ |
| **Playlists** | ✅ | ✅ |
| **Mini Player** | ✅ | ✅ |

---

## Troubleshooting

### Backend not connecting?
```bash
# Check if backend is running
curl http://localhost:5001/api/health

# Should return: {"status":"ok"}
```

### Can't play YouTube Music?
1. Make sure backend is running
2. Check browser console for errors
3. Try restarting backend: `docker-compose restart`

### Spotify Premium not working?
1. Make sure you have Spotify Premium
2. Check if Client ID is correct in `.env.local`
3. Try logging out and back in

---

## What's Next?

- 🎨 Try all 20 background themes in Settings
- 📝 Create playlists and save them to Spotify
- 🎵 Toggle between Spotify and YouTube Music
- 📱 Use mini player while browsing

Enjoy! 🎉
