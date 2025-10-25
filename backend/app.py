from flask import Flask, request, jsonify, redirect, Response
from flask_cors import CORS
from ytmusicapi import YTMusic
import os
import yt_dlp
import requests
import certifi
import ssl
import json
from pathlib import Path
import tempfile
import hashlib

app = Flask(__name__)
CORS(app)

ytmusic = YTMusic()

# Create cache directory for lyrics
LYRICS_CACHE_DIR = Path(tempfile.gettempdir()) / 'nova_lyrics_cache'
LYRICS_CACHE_DIR.mkdir(exist_ok=True)

# Global variable to hold Whisper model (lazy load)
whisper_model = None

def get_whisper_model():
    """Lazy load Whisper model"""
    global whisper_model
    if whisper_model is None:
        try:
            from faster_whisper import WhisperModel
            print("Loading Whisper model (base - better accuracy for multi-language)...")
            # Use 'base' model for better accuracy, especially for non-English songs
            # Models: tiny (fastest) < base (balanced) < small (best accuracy but slower)
            whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
            print("✓ Whisper model loaded!")
        except Exception as e:
            print(f"Error loading Whisper model: {e}")
    return whisper_model

@app.route('/api/search', methods=['GET'])
def search():
    """Search for tracks on YouTube Music"""
    query = request.args.get('q', '')
    if not query:
        return jsonify({'error': 'Query parameter required'}), 400
    
    try:
        results = ytmusic.search(query, filter='songs', limit=20)
        
        formatted_results = []
        for track in results:
            video_id = track.get('videoId')
            thumbnail_url = ''
            
            if video_id:
                thumbnail_urls_to_try = [
                    f'https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg',
                    f'https://i.ytimg.com/vi/{video_id}/sddefault.jpg',
                    f'https://i.ytimg.com/vi/{video_id}/hqdefault.jpg'
                ]
                thumbnail_url = thumbnail_urls_to_try[0]
            elif track.get('thumbnails'):
                thumbnails = track['thumbnails']
                if thumbnails:
                    thumbnail_url = thumbnails[-1]['url']
                    if '=w' in thumbnail_url or '=s' in thumbnail_url:
                        thumbnail_url = thumbnail_url.split('=w')[0].split('=s')[0]
            
            formatted_track = {
                'id': track.get('videoId'),
                'name': track.get('title'),
                'artists': [{'name': artist['name']} for artist in track.get('artists', [])],
                'album': {
                    'name': track.get('album', {}).get('name', 'Unknown Album') if track.get('album') else 'Unknown Album',
                    'images': [
                        {'url': thumbnail_url, 'height': 640, 'width': 640}
                    ]
                },
                'duration_ms': track.get('duration_seconds', 0) * 1000 if track.get('duration_seconds') else 0,
                'uri': f"ytmusic:{track.get('videoId')}",
                'preview_url': None,
                'external_urls': {
                    'youtube': f"https://music.youtube.com/watch?v={track.get('videoId')}"
                }
            }
            formatted_results.append(formatted_track)
        
        return jsonify({'tracks': {'items': formatted_results}})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/track/<video_id>', methods=['GET'])
def get_track(video_id):
    """Get track streaming URL using yt-dlp"""
    try:
        ydl_opts = {
            'format': 'bestaudio/best',
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f'https://music.youtube.com/watch?v={video_id}', download=False)
            
            audio_url = info.get('url')
            
            return jsonify({
                'videoId': video_id,
                'audioUrl': audio_url,
                'title': info.get('title'),
                'duration': info.get('duration')
            })
    except Exception as e:
        print(f"Error getting track: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/stream/<video_id>', methods=['GET'])
def stream_track(video_id):
    """Stream audio directly from YouTube Music - URL is fetched fresh on each request"""
    try:
        ydl_opts = {
            'format': 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best',
            'quiet': False,
            'no_warnings': False,
            'extract_flat': False,
            'nocheckcertificate': False,
            'prefer_insecure': False,
            'legacy_server_connect': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print(f"Extracting info for video {video_id}...")
            info = ydl.extract_info(f'https://www.youtube.com/watch?v={video_id}', download=False)
            
            audio_url = info.get('url')
            
            if not audio_url:
                if info.get('requested_formats'):
                    for fmt in info['requested_formats']:
                        if fmt.get('acodec') != 'none':
                            audio_url = fmt.get('url')
                            break
                elif info.get('formats'):
                    for fmt in info['formats']:
                        if fmt.get('acodec') != 'none' and fmt.get('url'):
                            audio_url = fmt.get('url')
                            break
            
            if not audio_url:
                return jsonify({'error': 'No audio URL found'}), 404
            
            range_header = request.headers.get('Range', None)
            
            print(f"Streaming video {video_id}, audio URL: {audio_url[:100]}...")
            
            upstream_headers = {}
            if range_header:
                upstream_headers['Range'] = range_header
            
            resp = requests.get(audio_url, headers=upstream_headers, stream=True, timeout=30)
            
            content_type = resp.headers.get('Content-Type', 'audio/webm')
            
            response_headers = {
                'Content-Type': content_type,
                'Accept-Ranges': 'bytes',
            }
            
            if range_header and resp.status_code == 206:
                response_headers['Content-Range'] = resp.headers.get('Content-Range')
                response_headers['Content-Length'] = resp.headers.get('Content-Length')
                status_code = 206
            else:
                if 'Content-Length' in resp.headers:
                    response_headers['Content-Length'] = resp.headers.get('Content-Length')
                status_code = 200
            
            def generate():
                try:
                    for chunk in resp.iter_content(chunk_size=8192):
                        if chunk:
                            yield chunk
                finally:
                    resp.close()
            
            return Response(generate(), status=status_code, headers=response_headers)
            
    except Exception as e:
        print(f"Error streaming track: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/playlist/create', methods=['POST'])
def create_playlist():
    """Create a playlist on YouTube Music (requires auth)"""
    data = request.json
    title = data.get('title')
    description = data.get('description', '')
    video_ids = data.get('video_ids', [])
    
    if not title:
        return jsonify({'error': 'Title required'}), 400
    
    try:
        return jsonify({
            'success': True,
            'message': 'Playlist saved locally',
            'id': 'local_' + title.replace(' ', '_')
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/thumbnail/<video_id>', methods=['GET'])
def get_thumbnail(video_id):
    """Get valid thumbnail URL for a video"""
    try:
        qualities = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault', 'default']
        for quality in qualities:
            thumbnail_url = f'https://i.ytimg.com/vi/{video_id}/{quality}.jpg'
            resp = requests.head(thumbnail_url, timeout=5)
            if resp.status_code == 200:
                return jsonify({'thumbnail_url': thumbnail_url})
        
        return jsonify({'thumbnail_url': f'https://i.ytimg.com/vi/{video_id}/hqdefault.jpg'})
    except Exception as e:
        print(f"Error getting thumbnail: {str(e)}")
        return jsonify({'thumbnail_url': f'https://i.ytimg.com/vi/{video_id}/hqdefault.jpg'})

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'ytmusic-backend'})

@app.route('/api/recommendations/<video_id>', methods=['GET'])
def get_recommendations(video_id):
    """Get song recommendations based on a video ID"""
    try:
        # Get the watch playlist (related songs) from YouTube Music
        watch_playlist = ytmusic.get_watch_playlist(videoId=video_id, limit=20)
        
        if not watch_playlist or 'tracks' not in watch_playlist:
            return jsonify({'tracks': []})
        
        tracks = watch_playlist['tracks']
        formatted_results = []
        
        for track in tracks:
            track_video_id = track.get('videoId')
            if not track_video_id or track_video_id == video_id:
                continue  # Skip the current song
                
            thumbnail_url = ''
            if track_video_id:
                thumbnail_url = f'https://i.ytimg.com/vi/{track_video_id}/maxresdefault.jpg'
            elif track.get('thumbnail'):
                thumbnails = track['thumbnail']
                if thumbnails:
                    thumbnail_url = thumbnails[-1]['url']
                    if '=w' in thumbnail_url or '=s' in thumbnail_url:
                        thumbnail_url = thumbnail_url.split('=w')[0].split('=s')[0]
            
            formatted_track = {
                'id': track_video_id,
                'name': track.get('title'),
                'artists': [{'name': artist['name']} for artist in track.get('artists', [])],
                'album': {
                    'name': track.get('album', {}).get('name', 'Unknown Album') if track.get('album') else 'Unknown Album',
                    'images': [
                        {'url': thumbnail_url, 'height': 640, 'width': 640}
                    ]
                },
                'duration_ms': track.get('duration_seconds', 0) * 1000 if track.get('duration_seconds') else 0,
                'uri': f"ytmusic:{track_video_id}",
                'preview_url': None,
                'external_urls': {
                    'youtube': f"https://music.youtube.com/watch?v={track_video_id}"
                }
            }
            formatted_results.append(formatted_track)
        
        return jsonify({'tracks': formatted_results})
    except Exception as e:
        print(f"Error getting recommendations: {e}")
        return jsonify({'error': str(e), 'tracks': []}), 500

@app.route('/api/lyrics/<video_id>', methods=['GET'])
def get_lyrics(video_id):
    try:
        # Check cache first
        cache_file = LYRICS_CACHE_DIR / f"{video_id}.json"
        if cache_file.exists():
            print(f"✓ Found cached lyrics for {video_id}")
            with open(cache_file, 'r', encoding='utf-8') as f:
                cached_data = json.load(f)
                return jsonify(cached_data)
        
        # Always use Whisper AI for karaoke-style synced lyrics!
        print(f"🎤 No cache found, starting Whisper AI transcription for {video_id}...")
        result_data = {
            'lyrics': 'Transcribing lyrics with AI... This may take 15-30 seconds.',
            'source': 'transcribing',
            'synced': False,
            'segments': []
        }
        return jsonify(result_data)
            
    except Exception as e:
        print(f"Error getting lyrics: {str(e)}")
        return jsonify({'error': str(e), 'lyrics': 'Lyrics not available'}), 500

@app.route('/api/lyrics/<video_id>/transcribe', methods=['POST'])
def transcribe_lyrics(video_id):
    """Transcribe lyrics using Whisper AI"""
    try:
        # Check cache first
        cache_file = LYRICS_CACHE_DIR / f"{video_id}.json"
        if cache_file.exists():
            print(f"✓ Found cached transcription for {video_id}")
            with open(cache_file, 'r', encoding='utf-8') as f:
                cached_data = json.load(f)
                if cached_data.get('source') == 'whisper_ai':
                    return jsonify(cached_data)
        
        print(f"🎤 Starting Whisper transcription for {video_id}...")
        
        # Download audio file
        audio_file = LYRICS_CACHE_DIR / f"{video_id}.mp3"
        
        if not audio_file.exists():
            print("📥 Downloading audio...")
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': str(audio_file.with_suffix('')),
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
                'quiet': True,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([f'https://music.youtube.com/watch?v={video_id}'])
        
        # Transcribe with Whisper
        print("🎵 Transcribing with Whisper AI...")
        model = get_whisper_model()
        
        if model is None:
            return jsonify({
                'error': 'Whisper model not available',
                'lyrics': 'AI transcription unavailable'
            }), 500
        
        # Auto-detect language (supports 99 languages!)
        segments_list, info = model.transcribe(str(audio_file), word_timestamps=False)
        detected_language = info.language
        print(f"🌍 Detected language: {detected_language}")
        
        lyrics_segments = []
        lyrics_lines = []
        
        for segment in segments_list:
            text = segment.text.strip()
            if text:
                lyrics_lines.append(text)
                lyrics_segments.append({
                    'start': segment.start,
                    'text': text
                })
        
        lyrics_text = '\n'.join(lyrics_lines)
        
        # Cache the result
        result_data = {
            'lyrics': lyrics_text,
            'source': 'whisper_ai',
            'synced': True,
            'segments': lyrics_segments
        }
        
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(result_data, f, ensure_ascii=False, indent=2)
        
        # Clean up audio file to save storage - we only need the JSON!
        audio_file.unlink(missing_ok=True)
        print(f"✓ Audio file deleted, lyrics cached")
        
        print(f"✓ Transcription complete! {len(lyrics_segments)} segments")
        return jsonify(result_data)
        
    except Exception as e:
        print(f"Error transcribing: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'lyrics': 'Transcription failed'
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, host='0.0.0.0', port=port)
