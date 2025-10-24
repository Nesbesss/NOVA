# 🐳 Docker Deployment Guide

Run the entire Nova app (frontend + backend) in a single Docker container!

## 🚀 One-Click Start

```bash
./start-nova.sh
```

This script will build and start everything automatically!

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Option 2: Docker CLI

```bash
# Build the image
docker build -t nova .

# Run the container
docker run -d \
  --name nova \
  -p 5173:5173 \
  -p 5001:5001 \
  nova

# View logs
docker logs -f nova

# Stop
docker stop nova
docker rm nova
```

## What's Running

The container runs:
- ✅ **Frontend** (React + Vite) on port **5173**
- ✅ **Backend** (Flask + ytmusicapi + yt-dlp) on port **5001**
- ✅ Both services start automatically and restart if they crash

## Access the App

Once running, open your browser:
- **App**: http://localhost:5173
- **API Health Check**: http://localhost:5001/api/health

## Environment Variables

The Docker build uses `.env.local` automatically. Default values:

```env
```bash
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
VITE_REDIRECT_URI=http://127.0.0.1:5173
```
VITE_BACKEND_URL=http://localhost:5001
VITE_USE_YTMUSIC=true
```

## Container Details

### Image Size
- Multi-stage build keeps image size optimized
- Base: Python 3.11 slim + Node.js 18
- Includes: Flask, ytmusicapi, yt-dlp, serve

### Health Check
The container includes a health check that:
- Tests backend API every 30 seconds
- Ensures backend is responsive
- Auto-restarts if unhealthy

### Ports
- `5173`: Frontend (React app)
- `5001`: Backend (Flask API)

## Production Deployment

### Deploy to a VPS/Server

1. Install Docker on your server
2. Clone the repo
3. Run `docker-compose up -d`
4. Access via `http://your-server-ip:5173`

### Environment Variables for Production

Create a `.env.production` file:

```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
VITE_REDIRECT_URI=http://your-domain.com
VITE_BACKEND_URL=http://your-domain.com:5001
VITE_USE_YTMUSIC=true
```

Then rebuild:
```bash
cp .env.production .env.local
docker-compose up -d --build
```

## Troubleshooting

### Check if services are running
```bash
docker exec minplay-app ps aux
```

### Check backend logs
```bash
docker logs minplay-app | grep Flask
```

### Check frontend logs
```bash
docker logs minplay-app | grep serve
```

### Restart services
```bash
docker-compose restart
```

### Rebuild from scratch
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Development vs Production

**Development** (current setup):
```bash
npm run dev                    # Frontend
cd backend && python app.py    # Backend
```

**Production** (Docker):
```bash
docker-compose up -d           # Everything!
```

## Features Included

- ✅ YouTube Music playback (free, no ads)
- ✅ Spotify Premium support
- ✅ Audio visualizer
- ✅ Mini player widget
- ✅ 20 background themes
- ✅ Playlist creator
- ✅ Background playback

## License

MIT
