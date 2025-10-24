# YouTube Music Backend

Python Flask backend for the minimalist player using YouTube Music API.

## Setup

1. Install Python 3.8+
2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate  # On Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the server:
```bash
python app.py
```

Server will run on http://localhost:5001

## API Endpoints

- `GET /api/search?q=query` - Search for tracks
- `GET /api/track/<video_id>` - Get track details and streaming URL
- `POST /api/playlist/create` - Create playlist (local storage for now)
- `GET /api/health` - Health check

## Note

YouTube Music API provides audio streams directly, no authentication required for basic features.
For advanced features (user playlists, likes, etc.), you'd need OAuth setup.
