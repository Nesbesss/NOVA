import { useState, useEffect } from 'react';
import { searchTracks, createPlaylist, addTracksToPlaylist, getCurrentUser } from '../spotify';

export default function PlaylistCreator({ token, onClose, onPlayTrack }) {
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [tracks, setTracks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [localPlaylists, setLocalPlaylists] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('local_playlists');
    if (saved) setLocalPlaylists(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchTracks(searchQuery, token);
        setSearchResults(data.tracks?.items || []);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, token]);

  const addTrackToPlaylist = (track) => {
    if (!tracks.find(t => t.id === track.id)) {
      setTracks(prevTracks => [...prevTracks, track]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeTrack = (trackId) => {
    setTracks(tracks.filter(t => t.id !== trackId));
  };

  const saveLocally = () => {
    if (!playlistName.trim() || tracks.length === 0) return;

    const newPlaylist = {
      id: Date.now().toString(),
      name: playlistName,
      description: playlistDescription,
      tracks: tracks,
      createdAt: new Date().toISOString(),
    };

    const updated = [...localPlaylists, newPlaylist];
    setLocalPlaylists(updated);
    localStorage.setItem('local_playlists', JSON.stringify(updated));

    setPlaylistName('');
    setPlaylistDescription('');
    setTracks([]);
  };

  const saveToSpotify = async () => {
    if (!playlistName.trim() || tracks.length === 0) return;

    try {
      const user = await getCurrentUser(token);
      const playlist = await createPlaylist(user.id, playlistName, playlistDescription, token);
      const uris = tracks.map(t => t.uri);
      await addTracksToPlaylist(playlist.id, uris, token);
      
      alert('Playlist created on Spotify!');
      setPlaylistName('');
      setPlaylistDescription('');
      setTracks([]);
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Failed to create playlist on Spotify');
    }
  };

  const playPlaylist = (playlist) => {
    if (playlist.tracks && playlist.tracks.length > 0) {
      onPlayTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  const saveLocalPlaylistToSpotify = async (playlist) => {
    try {
      const user = await getCurrentUser(token);
      const newPlaylist = await createPlaylist(user.id, playlist.name, playlist.description, token);
      const uris = playlist.tracks.map(t => t.uri);
      await addTracksToPlaylist(newPlaylist.id, uris, token);
      
      alert(`"${playlist.name}" saved to Spotify!`);
    } catch (error) {
      console.error('Error saving to Spotify:', error);
      alert('Failed to save playlist to Spotify');
    }
  };

  return (
    <div className="playlist-screen">
      <div className="playlist-overlay">
        <div className="playlist-content">
          <div className="playlist-header">
            <h1 className="playlist-title">playlists</h1>
            <button className="close-button" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="playlist-two-columns">
            <div className="playlist-creator-column">
              <h2 className="section-title">create playlist</h2>
              
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="playlist name..."
                className="playlist-input"
              />
              
              <textarea
                value={playlistDescription}
                onChange={(e) => setPlaylistDescription(e.target.value)}
                placeholder="description (optional)..."
                className="playlist-textarea"
                rows="3"
              />

              <div className="search-bar-wrapper">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="search tracks to add..."
                  className="playlist-search-input"
                />
              </div>

              {isSearching && <div className="loading-text">searching...</div>}

              {searchResults.length > 0 && (
                <div className="playlist-search-results">
                  {searchResults.slice(0, 5).map((track) => (
                    <div
                      key={track.id}
                      className="playlist-search-item"
                      onClick={() => addTrackToPlaylist(track)}
                    >
                      <img
                        src={track.album.images[2]?.url || track.album.images[0]?.url}
                        alt={track.name}
                        className="playlist-track-img"
                      />
                      <div className="playlist-track-info">
                        <div className="playlist-track-name">{track.name}</div>
                        <div className="playlist-track-artist">
                          {track.artists.map((a) => a.name).join(', ')}
                        </div>
                      </div>
                      <span className="add-icon">+</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="tracks-list">
                <h3 className="tracks-title">tracks ({tracks.length})</h3>
                {tracks.map((track, index) => (
                  <div key={track.id} className="track-item">
                    <span className="track-number">{index + 1}</span>
                    <img src={track.album.images[2]?.url} alt={track.name} className="track-thumb" />
                    <div className="track-info">
                      <div className="track-name">{track.name}</div>
                      <div className="track-artist">{track.artists.map(a => a.name).join(', ')}</div>
                    </div>
                    <button className="remove-btn" onClick={() => removeTrack(track.id)}>×</button>
                  </div>
                ))}
              </div>

              <div className="save-buttons">
                <button 
                  className="save-local-btn" 
                  onClick={saveLocally}
                  disabled={!playlistName.trim() || tracks.length === 0}
                >
                  save locally
                </button>
                <button 
                  className="save-spotify-btn" 
                  onClick={saveToSpotify}
                  disabled={!playlistName.trim() || tracks.length === 0}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  save to spotify
                </button>
              </div>
            </div>

            <div className="playlists-list-column">
              <h2 className="section-title">your playlists</h2>
              <div className="saved-playlists">
                {localPlaylists.length === 0 ? (
                  <p className="empty-message">no playlists yet...</p>
                ) : (
                  localPlaylists.map((playlist) => (
                    <div key={playlist.id} className="saved-playlist-item">
                      <div className="saved-playlist-info">
                        <h3 className="saved-playlist-name">{playlist.name}</h3>
                        <p className="saved-playlist-desc">{playlist.description || 'No description'}</p>
                        <span className="saved-playlist-count">{playlist.tracks.length} tracks</span>
                      </div>
                      <div className="playlist-actions">
                        <button 
                          className="spotify-save-icon-btn"
                          onClick={() => saveLocalPlaylistToSpotify(playlist)}
                          title="Save to Spotify"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                          </svg>
                        </button>
                        <button 
                          className="play-playlist-btn"
                          onClick={() => playPlaylist(playlist)}
                          title="Play Playlist"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
