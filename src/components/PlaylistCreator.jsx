import { useState, useEffect } from 'react';
import { searchTracksYTMusic } from '../ytmusicApi';

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
        const data = await searchTracksYTMusic(searchQuery);
        setSearchResults(data.tracks?.items || []);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

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
    alert(`"${newPlaylist.name}" saved locally!`);
  };

  const playPlaylist = (playlist) => {
    if (playlist.tracks && playlist.tracks.length > 0) {
      onPlayTrack(playlist.tracks[0], playlist.tracks);
      onClose(); // Close the playlist screen when playing
    }
  };

  return (
    <div className="playlist-screen">
      <div className="playlist-overlay">
        <div className="playlist-content">
          <div className="playlist-header">
            <div className="header-left">
              <div className="header-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
              </div>
              <div className="header-text">
                <h1 className="playlist-title">playlists</h1>
                <p className="playlist-subtitle">create & manage your music collections</p>
              </div>
            </div>
            <button className="close-button" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Creator Section */}
          <div className="playlist-creator-section">
            <div className="creator-card">
              <div className="card-header">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                <h2 className="card-title">create new playlist</h2>
              </div>
              
              <div className="creator-inputs">
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="give your playlist a name..."
                  className="playlist-input"
                />
                
                <textarea
                  value={playlistDescription}
                  onChange={(e) => setPlaylistDescription(e.target.value)}
                  placeholder="add a description (optional)..."
                  className="playlist-textarea"
                  rows="2"
                />
              </div>

              <div className="search-section">
                <div className="search-bar-wrapper">
                  <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="search for tracks..."
                  className="playlist-search-input"
                />
              </div>

              {isSearching && (
                <div className="loading-text">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="loading-spinner">
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                  searching...
                </div>
              )}

              {searchResults.length > 0 && (
                  <div className="playlist-search-results">
                    {searchResults.slice(0, 5).map((track) => (
                      <div
                        key={track.id}
                        className="playlist-search-item"
                        onClick={() => addTrackToPlaylist(track)}
                      >
                        <img
                          src={track.album.images[0]?.url || '/default-cover.png'}
                          alt={track.name}
                          className="playlist-track-img"
                        />
                        <div className="playlist-track-info">
                          <div className="playlist-track-name">{track.name}</div>
                          <div className="playlist-track-artist">
                            {track.artists.map((a) => a.name).join(', ')}
                          </div>
                        </div>
                        <div className="add-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {tracks.length > 0 && (
                <div className="tracks-preview">
                  <div className="tracks-header">
                    <div className="tracks-header-left">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                      </svg>
                      <h3 className="tracks-title">tracks in playlist</h3>
                    </div>
                    <span className="tracks-count">{tracks.length} track{tracks.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="tracks-list">
                    {tracks.map((track, index) => (
                      <div key={track.id} className="track-item">
                        <span className="track-number">{index + 1}</span>
                        <img src={track.album.images[0]?.url || '/default-cover.png'} alt={track.name} className="track-thumb" />
                        <div className="track-info">
                          <div className="track-name">{track.name}</div>
                          <div className="track-artist">{track.artists.map(a => a.name).join(', ')}</div>
                        </div>
                        <button className="remove-btn" onClick={() => removeTrack(track.id)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                className="save-playlist-btn" 
                onClick={saveLocally}
                disabled={!playlistName.trim() || tracks.length === 0}
              >
                <svg className="save-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                <span>save playlist</span>
              </button>
            </div>
          </div>

          {/* Saved Playlists Grid */}
          <div className="playlists-grid-section">
            <div className="section-header">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <h2 className="section-title">your collection</h2>
            </div>
            <div className="playlists-grid">
              {localPlaylists.length === 0 ? (
                <div className="empty-state">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 8v4m0 4h.01"></path>
                  </svg>
                  <p className="empty-message">no playlists yet</p>
                  <p className="empty-submessage">create your first playlist above!</p>
                </div>
              ) : (
                localPlaylists.map((playlist, index) => (
                  <div key={playlist.id} className="playlist-card" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="playlist-card-cover">
                      {playlist.tracks.length > 0 ? (
                        <div className="cover-grid">
                          {playlist.tracks.slice(0, 4).map((track, idx) => (
                            <img 
                              key={idx}
                              src={track.album.images[0]?.url || '/default-cover.png'} 
                              alt=""
                              className="cover-image"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="cover-placeholder">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18V5l12-2v13"></path>
                            <circle cx="6" cy="18" r="3"></circle>
                            <circle cx="18" cy="16" r="3"></circle>
                          </svg>
                        </div>
                      )}
                      <button 
                        className="play-overlay-btn"
                        onClick={() => playPlaylist(playlist)}
                        title="Play Playlist"
                      >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      </button>
                    </div>
                    <div className="playlist-card-content">
                      <h3 className="playlist-card-name">{playlist.name}</h3>
                      <p className="playlist-card-desc">{playlist.description || 'No description'}</p>
                      <div className="playlist-card-footer">
                        <span className="playlist-card-count">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18V5l12-2v13"></path>
                            <circle cx="6" cy="18" r="3"></circle>
                            <circle cx="18" cy="16" r="3"></circle>
                          </svg>
                          {playlist.tracks.length} track{playlist.tracks.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
