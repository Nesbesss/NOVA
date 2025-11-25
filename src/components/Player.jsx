import { useState, useEffect, useRef } from 'react';
import { pausePlayback, resumePlayback, skipToNext, skipToPrevious } from '../spotify';
import { 
  isTrackLiked,
  likeTrack, 
  unlikeTrack, 
  getPlaylists, 
  addTrackToPlaylist,
  createPlaylist as createLocalPlaylist
} from '../localLibrary';
import ShareModal from './ShareModal';

export default function Player({ currentTrack, token, player, onBack, onNextTrack, onPreviousTrack, hasNext, hasPrevious, onArtistClick }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addedToPlaylist, setAddedToPlaylist] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!player) return;

    player.addListener('player_state_changed', (state) => {
      if (!state) return;
      
      setIsPlaying(!state.paused);
      setPosition(state.position);
      setDuration(state.duration);
    });

    // Update position every second when playing
    const interval = setInterval(() => {
      if (player) {
        player.getCurrentState().then(state => {
          if (state && !state.paused) {
            setPosition(state.position);
          }
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [player]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
        setShowPlaylistMenu(false);
        setShowCreatePlaylist(false);
      }
    };

    if (showMenu || showPlaylistMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu, showPlaylistMenu]);

  // Check if track is liked and load playlists
  useEffect(() => {
    const loadLikeStatus = () => {
      if (!currentTrack?.id) return;
      try {
        const liked = isTrackLiked(currentTrack.id);
        setIsLiked(liked);
      } catch (error) {
        console.error('Error checking if track is liked:', error);
      }
    };

    const loadPlaylists = () => {
      try {
        const data = getPlaylists();
        setPlaylists(data || []);
      } catch (error) {
        console.error('Error loading playlists:', error);
      }
    };

    loadLikeStatus();
    loadPlaylists();
  }, [currentTrack]);

  const handlePlayPause = async () => {
    if (isPlaying) {
      await pausePlayback(token);
    } else {
      await resumePlayback(token);
    }
  };

  const handleNext = async () => {
    if (onNextTrack && hasNext) {
      onNextTrack();
    } else {
      await skipToNext(token);
    }
  };

  const handlePrevious = async () => {
    if (onPreviousTrack && hasPrevious) {
      onPreviousTrack();
    } else {
      await skipToPrevious(token);
    }
  };

  const handleLikeToggle = () => {
    if (!currentTrack?.id) return;
    
    try {
      if (isLiked) {
        unlikeTrack(currentTrack.id);
        setIsLiked(false);
      } else {
        likeTrack(currentTrack.id, currentTrack);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleAddToPlaylist = (playlistId) => {
    if (!currentTrack) return;
    
    try {
      addTrackToPlaylist(playlistId, currentTrack);
      const playlist = playlists.find(p => p.id === playlistId);
      setAddedToPlaylist(playlist?.name || 'Playlist');
      setShowPlaylistMenu(false);
      setShowMenu(false);
      
      // Clear the notification after 3 seconds
      setTimeout(() => setAddedToPlaylist(null), 3000);
    } catch (error) {
      console.error('Error adding to playlist:', error);
    }
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    
    try {
      const newPlaylist = createLocalPlaylist(newPlaylistName, '');
      
      // Add current track to the new playlist
      addTrackToPlaylist(newPlaylist.id, currentTrack);
      
      // Reload playlists
      const data = getPlaylists();
      setPlaylists(data || []);
      
      setAddedToPlaylist(newPlaylistName);
      setShowCreatePlaylist(false);
      setShowPlaylistMenu(false);
      setShowMenu(false);
      setNewPlaylistName('');
      
      // Clear the notification after 3 seconds
      setTimeout(() => setAddedToPlaylist(null), 3000);
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  const albumImage = currentTrack.album.images[0]?.url;

  return (
    <div className="player-fullscreen">
      <div 
        className="player-background" 
        style={{ backgroundImage: `url(${albumImage})` }}
      />
      
      <div className="player-overlay">
        <button className="back-button" onClick={onBack}>
          ← back
        </button>
        
        <div className="player-content">
          <div className="player-image-wrapper">
            <img src={albumImage} alt={currentTrack.name} className="player-image-full" />
          </div>
          
          <div className="player-controls-wrapper">
            <div className="track-info">
              <div className="track-name-full">{currentTrack.name}</div>
              <div className="track-artist-full">
                {currentTrack.artists.map((artist, idx) => (
                  <span key={artist.id || idx}>
                    <span 
                      className="artist-link"
                      onClick={() => onArtistClick && onArtistClick(artist)}
                    >
                      {artist.name}
                    </span>
                    {idx < currentTrack.artists.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </div>

            <div className="audio-bars">
              <div className="audio-bar" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}></div>
              <div className="audio-bar" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}></div>
              <div className="audio-bar" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}></div>
              <div className="audio-bar" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}></div>
              <div className="audio-bar" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}></div>
              <div className="audio-bar" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}></div>
              <div className="audio-bar" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}></div>
              <div className="audio-bar" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}></div>
              <div className="audio-bar" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}></div>
            </div>

            <div className="controls-full">
              <button className="control-btn" onClick={handlePrevious}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 19 2 12 11 5 11 19"></polygon>
                  <polygon points="22 19 13 12 22 5 22 19"></polygon>
                </svg>
              </button>
              <button onClick={handlePlayPause} className="play-button-full">
                {isPlaying ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                )}
              </button>
              <button className="control-btn" onClick={handleNext}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 19 22 12 13 5 13 19"></polygon>
                  <polygon points="2 19 11 12 2 5 2 19"></polygon>
                </svg>
              </button>

              {/* Three-dot menu button */}
              <div className="menu-container" ref={menuRef}>
                <button 
                  className={`control-btn menu-btn ${showMenu ? 'active' : ''}`}
                  onClick={() => setShowMenu(!showMenu)}
                  title="More options"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                    <circle cx="12" cy="19" r="2"></circle>
                  </svg>
                </button>
                
                {/* Dropdown menu */}
                {showMenu && !showPlaylistMenu && (
                  <div className="dropdown-menu">
                    <button 
                      className={`menu-item ${isLiked ? 'active' : ''}`}
                      onClick={handleLikeToggle}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      <span>{isLiked ? 'Unlike' : 'Like'}</span>
                    </button>

                    <button 
                      className="menu-item"
                      onClick={() => setShowPlaylistMenu(true)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14"></path>
                      </svg>
                      <span>Add to Playlist</span>
                    </button>

                    <button 
                      className="menu-item"
                      onClick={() => { setShowShare(true); setShowMenu(false); }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                      </svg>
                      <span>Share</span>
                    </button>
                  </div>
                )}

                {/* Playlist selection menu */}
                {showPlaylistMenu && !showCreatePlaylist && (
                  <div className="dropdown-menu playlist-menu">
                    <div className="menu-header">
                      <button className="back-btn" onClick={() => setShowPlaylistMenu(false)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 12H5M12 19l-7-7 7-7"></path>
                        </svg>
                      </button>
                      <span>Add to Playlist</span>
                    </div>
                    
                    <button 
                      className="menu-item create-playlist-btn"
                      onClick={() => setShowCreatePlaylist(true)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14"></path>
                      </svg>
                      <span>Create Playlist</span>
                    </button>

                    <div className="playlist-scroll">
                      {playlists.map((playlist) => (
                        <button 
                          key={playlist.id}
                          className="menu-item playlist-item"
                          onClick={() => handleAddToPlaylist(playlist.id)}
                        >
                          {playlist.images?.[0]?.url ? (
                            <img src={playlist.images[0].url} alt="" className="playlist-thumb" />
                          ) : (
                            <div className="playlist-thumb playlist-thumb-default">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                              </svg>
                            </div>
                          )}
                          <div className="playlist-info">
                            <span className="playlist-name">{playlist.name}</span>
                            <span className="playlist-count">{playlist.tracks?.length || 0} songs</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Create playlist form */}
                {showCreatePlaylist && (
                  <div className="dropdown-menu create-playlist-form">
                    <div className="menu-header">
                      <button className="back-btn" onClick={() => setShowCreatePlaylist(false)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 12H5M12 19l-7-7 7-7"></path>
                        </svg>
                      </button>
                      <span>Create Playlist</span>
                    </div>
                    
                    <input 
                      type="text"
                      placeholder="Playlist name"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      className="playlist-name-input"
                      autoFocus
                    />
                    
                    <button 
                      className="create-btn"
                      onClick={handleCreatePlaylist}
                      disabled={!newPlaylistName.trim()}
                    >
                      Create & Add
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="progress-full">
              <span className="time-full">{formatTime(position)}</span>
              <div className="progress-bar-full">
                <div 
                  className="progress-fill-full" 
                  style={{ width: `${(position / duration) * 100}%` }}
                />
              </div>
              <span className="time-full">{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Playlist notification */}
        {addedToPlaylist && (
          <div className="playlist-notification">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5"></path>
            </svg>
            <span>Added to {addedToPlaylist}</span>
          </div>
        )}

        {/* Share modal */}
        {showShare && (
          <ShareModal 
            track={currentTrack} 
            onClose={() => setShowShare(false)} 
          />
        )}
      </div>
    </div>
  );
}
