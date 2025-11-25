import { useState, useEffect } from 'react';
import { getLikedSongs, unlikeTrack, getPlaylists, addTrackToPlaylist, createPlaylist } from '../localLibrary';

export default function LikedSongsView({ onClose, onPlayTrack }) {
  const [likedSongs, setLikedSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [notification, setNotification] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const liked = getLikedSongs();
    const userPlaylists = getPlaylists();
    setLikedSongs(liked);
    setPlaylists(userPlaylists);
  };

  const handleUnlike = (trackId) => {
    unlikeTrack(trackId);
    loadData();
    showNotification('Removed from liked songs');
  };

  const handleAddToPlaylist = (playlistId, track) => {
    addTrackToPlaylist(playlistId, track);
    const playlist = playlists.find(p => p.id === playlistId);
    showNotification(`Added to ${playlist?.name}`);
    setShowPlaylistMenu(null);
  };

  const handleCreateAndAdd = (track) => {
    if (!newPlaylistName.trim()) return;
    
    const newPlaylist = createPlaylist(newPlaylistName, '');
    addTrackToPlaylist(newPlaylist.id, track);
    
    showNotification(`Created "${newPlaylistName}" and added track`);
    setNewPlaylistName('');
    setShowCreatePlaylist(null);
    loadData();
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 2000);
  };

  const playAll = () => {
    if (likedSongs.length > 0) {
      onPlayTrack(likedSongs[0], likedSongs);
      onClose();
    }
  };

  const playFromTrack = (index) => {
    if (likedSongs.length > 0) {
      onPlayTrack(likedSongs[index], likedSongs);
      onClose();
    }
  };

  return (
    <div className="liked-songs-view">
      <div className="liked-songs-overlay">
        <div className="liked-songs-content">
          {}
          <div className="liked-songs-header">
            <div className="header-left">
              <div className="liked-songs-icon">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="white">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
              <div className="liked-songs-info">
                <h1 className="liked-songs-title">liked songs</h1>
                <p className="liked-songs-count">{likedSongs.length} song{likedSongs.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button className="close-button" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {}
          {likedSongs.length > 0 && (
            <div className="liked-songs-actions">
              <button className="play-all-btn" onClick={playAll}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <span>Play All</span>
              </button>
            </div>
          )}

          {}
          <div className="liked-songs-list">
            {likedSongs.length === 0 ? (
              <div className="empty-state">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <p className="empty-message">no liked songs yet</p>
                <p className="empty-submessage">songs you like will appear here</p>
              </div>
            ) : (
              likedSongs.map((track, index) => (
                <div key={track.id} className="liked-song-item">
                  <div className="song-number">{index + 1}</div>
                  <img 
                    src={track.album?.images?.[0]?.url || '/placeholder.png'} 
                    alt={track.name}
                    className="song-image"
                    onClick={() => playFromTrack(index)}
                  />
                  <div className="song-info" onClick={() => playFromTrack(index)}>
                    <div className="song-name">{track.name}</div>
                    <div className="song-artist">
                      {track.artists?.map(a => a.name).join(', ')}
                    </div>
                  </div>
                  <div className="song-duration">
                    {track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : '--:--'}
                  </div>
                  <div className="song-actions">
                    <button 
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPlaylistMenu(showPlaylistMenu === track.id ? null : track.id);
                        setShowCreatePlaylist(null);
                      }}
                      title="Add to playlist"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>
                    <button 
                      className="action-btn unlike-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnlike(track.id);
                      }}
                      title="Remove from liked songs"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>

                    {}
                    {showPlaylistMenu === track.id && (
                      <div className="playlist-dropdown">
                        <div className="playlist-dropdown-header">Add to playlist</div>
                        {playlists.length > 0 ? (
                          <div className="playlist-dropdown-list">
                            {playlists.map(playlist => (
                              <div 
                                key={playlist.id}
                                className="playlist-dropdown-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToPlaylist(playlist.id, track);
                                }}
                              >
                                <div className="playlist-dropdown-thumb">
                                  {playlist.tracks?.[0]?.album?.images?.[0]?.url ? (
                                    <img src={playlist.tracks[0].album.images[0].url} alt="" />
                                  ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M9 18V5l12-2v13"></path>
                                      <circle cx="6" cy="18" r="3"></circle>
                                      <circle cx="18" cy="16" r="3"></circle>
                                    </svg>
                                  )}
                                </div>
                                <div className="playlist-dropdown-info">
                                  <div className="playlist-dropdown-name">{playlist.name}</div>
                                  <div className="playlist-dropdown-count">{playlist.tracks?.length || 0} songs</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="playlist-dropdown-empty">No playlists yet</div>
                        )}
                        <div 
                          className="playlist-dropdown-create"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCreatePlaylist(track.id);
                            setShowPlaylistMenu(null);
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                          Create new playlist
                        </div>
                      </div>
                    )}

                    {}
                    {showCreatePlaylist === track.id && (
                      <div className="create-playlist-dropdown">
                        <input
                          type="text"
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          placeholder="Playlist name..."
                          className="create-playlist-input"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCreateAndAdd(track);
                            } else if (e.key === 'Escape') {
                              setShowCreatePlaylist(null);
                              setNewPlaylistName('');
                            }
                          }}
                        />
                        <div className="create-playlist-actions">
                          <button 
                            className="create-playlist-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateAndAdd(track);
                            }}
                          >
                            Create
                          </button>
                          <button 
                            className="cancel-playlist-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowCreatePlaylist(null);
                              setNewPlaylistName('');
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {}
      {notification && (
        <div className="liked-notification">
          {notification}
        </div>
      )}
    </div>
  );
}
