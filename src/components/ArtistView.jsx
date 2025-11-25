import { useState, useEffect } from 'react';

export default function ArtistView({ artist, token, onClose, onTrackSelect, useYTMusic }) {
  const [artistInfo, setArtistInfo] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [allTracks, setAllTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllTracks, setShowAllTracks] = useState(false);

  useEffect(() => {
    loadArtistData();
  }, [artist]);

  const loadArtistData = async () => {
    setLoading(true);
    
    if (useYTMusic) {
      await loadYTMusicArtist();
    } else {
      await loadSpotifyArtist();
    }
    
    setLoading(false);
  };

  const loadSpotifyArtist = async () => {
    try {
      
      const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artist.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const artistData = await artistRes.json();
      setArtistInfo(artistData);

      
      const tracksRes = await fetch(`https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=US`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tracksData = await tracksRes.json();
      setTopTracks(tracksData.tracks || []);

      
      const albumsRes = await fetch(`https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album,single&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const albumsData = await albumsRes.json();
      setAlbums(albumsData.items || []);

      
      const allAlbumTracks = [];
      const albumsToFetch = albumsData.items || [];
      
      
      for (const album of albumsToFetch) {
        try {
          const albumTracksRes = await fetch(`https://api.spotify.com/v1/albums/${album.id}/tracks`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const albumTracksData = await albumTracksRes.json();
          if (albumTracksData.items) {
            
            const tracksWithAlbum = albumTracksData.items.map(track => ({
              ...track,
              album: {
                id: album.id,
                name: album.name,
                images: album.images,
                release_date: album.release_date
              }
            }));
            allAlbumTracks.push(...tracksWithAlbum);
          }
        } catch (err) {
          console.error('Error loading album tracks:', err);
        }
      }
      
      
      const uniqueTracks = allAlbumTracks.reduce((acc, track) => {
        if (!acc.find(t => t.id === track.id)) {
          acc.push(track);
        }
        return acc;
      }, []);
      
      setAllTracks(uniqueTracks);
    } catch (error) {
      console.error('Error loading Spotify artist:', error);
    }
  };

  const loadYTMusicArtist = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5001`;
      
      
      const searchQuery = `${artist.name} top songs`;
      const response = await fetch(`${backendUrl}/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.tracks && data.tracks.items) {
        
        const artistTracks = data.tracks.items.filter(track => 
          track.artists.some(a => a.name.toLowerCase() === artist.name.toLowerCase())
        );
        setTopTracks(artistTracks.slice(0, 10));
        setAllTracks(artistTracks); 
      }

      
      if (artist.images) {
        setArtistInfo(artist);
      } else if (data.tracks && data.tracks.items && data.tracks.items.length > 0) {
        const matchingArtist = data.tracks.items[0].artists.find(a => 
          a.name.toLowerCase() === artist.name.toLowerCase()
        );
        setArtistInfo(matchingArtist || artist);
      } else {
        setArtistInfo(artist);
      }
    } catch (error) {
      console.error('Error loading YTMusic artist:', error);
      setArtistInfo(artist);
    }
  };

  const playTopTracks = () => {
    if (topTracks.length > 0) {
      onTrackSelect(topTracks[0], topTracks);
      onClose();
    }
  };

  const playTrack = (track, index) => {
    onTrackSelect(track, topTracks);
    onClose();
  };

  if (loading) {
    return (
      <div className="artist-view">
        <div className="artist-overlay">
          <div className="artist-content">
            <button className="close-button" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>loading artist...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="artist-view">
      <div className="artist-overlay">
        <div className="artist-content">
          {}
          <div className="artist-header">
            <div className="artist-header-bg" style={{
              backgroundImage: artistInfo?.images?.[0]?.url ? `url(${artistInfo.images[0].url})` : 'none'
            }}></div>
            <div className="artist-header-content">
              <button className="close-button" onClick={onClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              {artistInfo?.images?.[0]?.url && (
                <div className="artist-image">
                  <img src={artistInfo.images[0].url} alt={artist.name} />
                </div>
              )}
              <div className="artist-info">
                <span className="artist-label">ARTIST</span>
                <h1 className="artist-name">{artist.name}</h1>
                {artistInfo?.followers && (
                  <p className="artist-followers">
                    {artistInfo.followers.total.toLocaleString()} followers
                  </p>
                )}
                {artistInfo?.genres && artistInfo.genres.length > 0 && (
                  <div className="artist-genres">
                    {artistInfo.genres.slice(0, 3).map((genre, idx) => (
                      <span key={idx} className="genre-tag">{genre}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {}
          {topTracks.length > 0 && (
            <div className="artist-actions">
              <button className="play-all-btn" onClick={playTopTracks}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <span>Play</span>
              </button>
            </div>
          )}

          {}
          {(topTracks.length > 0 || allTracks.length > 0) && (
            <div className="artist-section">
              <div className="section-header-with-toggle">
                <h2 className="section-title">{showAllTracks ? 'all songs' : 'popular'}</h2>
                {allTracks.length > 10 && (
                  <button 
                    className="toggle-tracks-btn"
                    onClick={() => setShowAllTracks(!showAllTracks)}
                  >
                    {showAllTracks ? 'Show Popular' : 'See All'}
                  </button>
                )}
              </div>
              <div className="top-tracks-list">
                {(showAllTracks ? allTracks : topTracks).map((track, index) => (
                  <div 
                    key={track.id + index} 
                    className="top-track-item"
                    onClick={() => playTrack(track, index)}
                  >
                    <div className="track-number">{index + 1}</div>
                    <img 
                      src={track.album?.images?.[0]?.url || '/placeholder.png'} 
                      alt={track.name}
                      className="track-image"
                    />
                    <div className="track-info">
                      <div className="track-name">{track.name}</div>
                      <div className="track-stats">
                        {track.album?.name}
                      </div>
                    </div>
                    <div className="track-duration">
                      {track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : '--:--'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {}
          {albums.length > 0 && (
            <div className="artist-section">
              <h2 className="section-title">albums</h2>
              <div className="albums-grid">
                {albums.slice(0, 8).map((album) => (
                  <div key={album.id} className="album-card">
                    <div className="album-cover">
                      <img 
                        src={album.images?.[0]?.url || '/placeholder.png'} 
                        alt={album.name}
                      />
                      <div className="album-overlay">
                        <div className="play-icon-small">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="album-info">
                      <div className="album-name">{album.name}</div>
                      <div className="album-meta">
                        {new Date(album.release_date).getFullYear()} • {album.album_type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {}
          {topTracks.length === 0 && albums.length === 0 && (
            <div className="empty-state">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
              <p className="empty-message">no tracks found</p>
              <p className="empty-submessage">try searching for this artist</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
