# Minplay - Minimalist Music Player

A beautiful, minimalist music player supporting both **Spotify Premium** and **YouTube Music** (free, no ads).

## Features

- 🎵 **Dual Music Sources**
  - Spotify Premium playback with Web SDK
  - YouTube Music (free access, no ads required!)
- 🎨 **20 Customizable Background Themes**
- 🎵 **Audio Visualizer** with 9 animated bars
- � **Live Search** with 500ms debounce
- 📱 **Mini Player Widget** for background playback
- 📝 **Playlist Creator** with Spotify sync
- ⚙️ **Settings Panel** with music source toggle
- 🎧 **Full Playback Controls** (play/pause/skip/progress)

## Tech Stack

**Frontend:**
- React 18 + Vite
- Spotify Web Playback SDK (Premium users)
- HTML5 Audio (YouTube Music)
- Inter font from Google Fonts

**Backend (YouTube Music):**
- Python Flask
- ytmusicapi library
- Flask-CORS

## Setup

### 🐳 Option 1: Docker (Easiest!)

Run everything in one container:

```bash
docker-compose up -d
```

That's it! Open http://localhost:5173

For detailed Docker instructions, see [DOCKER.md](DOCKER.md)

### 🛠️ Option 2: Manual Setup

#### Frontend (Required)

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

App runs on `http://127.0.0.1:5173`

#### Backend (Optional - for YouTube Music)

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run Flask server
python app.py
```

Backend runs on `http://localhost:5001`

### Environment Configuration

The `.env.local` file should contain:

```env
```bash
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
VITE_REDIRECT_URI=http://127.0.0.1:5173
```
VITE_BACKEND_URL=http://localhost:5001
VITE_USE_YTMUSIC=true
```

## Usage

### Spotify Mode (Premium Required)
1. Click "Login with Spotify"
2. Authorize the app
3. Search tracks with live results
4. Full playback with Web Playback SDK

### YouTube Music Mode (Free, No Ads!)
1. Start backend server: `cd backend && python app.py`
2. Open Settings (gear icon)
3. Toggle to "YouTube Music"
4. Search and play any track for free!

## Features Deep Dive

### 🎵 Full-Screen Player
- Blurred album art background
- 9 animated audio visualizer bars
- Play/pause, skip previous/next
- Live progress bar with seek
- Playlist navigation

### 📱 Mini Player Widget
- Shows when playing in background
- Album art + track info
- 3 animated equalizer bars
- Click to return to full player

### 📝 Playlist Creator
- Search and add unlimited tracks
- Save locally with localStorage
- Sync to Spotify (optional)
- Play full playlists with navigation

### ⚙️ Settings Panel
- Music source toggle (Spotify/YouTube Music)
- 20 gradient background themes
- Logout option
- Theme persistence

## Design Philosophy

Minimalist brutalist aesthetic with:
- Black/red/white gradient themes
- Glassmorphism UI elements
- Smooth CSS animations (fadeIn, slideUp, scaleIn)
- Clean typography with Inter font

## API Endpoints (Backend)

- `GET /api/health` - Backend health check
- `GET /api/search?q=query` - Search YouTube Music
- `GET /api/track/<video_id>` - Get stream URL
- `POST /api/playlist/create` - Create playlist

## Requirements

**For Spotify:**
- Spotify Premium account

**For YouTube Music:**
- Python 3.8+
- Running Flask backend

## License

MIT

Enjoy your music! 🎶

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
