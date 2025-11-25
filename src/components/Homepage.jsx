import { useState, useEffect } from 'react';
import { getLikedSongs } from '../localLibrary';

export default function Homepage({ onTrackSelect, useYTMusic, token, onOpenSettings, onOpenPlaylists, onOpenLikedSongs, currentTrack, onShowPlayer, listeningHistory = [] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [forYou, setForYou] = useState([]);
  const [trending, setTrending] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [likedSongs, setLikedSongs] = useState([]);

  useEffect(() => {
    loadHomepageData();
  }, [useYTMusic, token]);

  
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5001`;
        const response = await fetch(`${backendUrl}/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.tracks?.items || []);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const loadHomepageData = async () => {
    setLoading(true);
    
    
    await loadLikedSongs();
    
    if (useYTMusic) {
      await loadYTMusicHome();
    } else {
      await loadSpotifyHome();
    }
    
    setLoading(false);
  };

  const loadLikedSongs = async () => {
    try {
      const likedTracks = getLikedSongs();
      console.log('=== LIKED SONGS DEBUG ===');
      console.log('Total count:', likedTracks.length);
      console.log('Songs:', likedTracks.map((t, i) => `${i + 1}. ${t.name} by ${t.artists?.map(a => a.name).join(', ')}`));
      console.log('Full data:', likedTracks);
      setLikedSongs(likedTracks);
    } catch (error) {
      console.error('Error loading liked songs:', error);
    }
  };

  const loadYTMusicHome = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5001`;
      
      
      let forYouTracks = [];
      
      
      if (listeningHistory.length > 0) {
        
        const artistCounts = {};
        listeningHistory.forEach(entry => {
          entry.artists?.forEach(artist => {
            artistCounts[artist.name] = (artistCounts[artist.name] || 0) + 1;
          });
        });
        
        
        const topArtists = Object.entries(artistCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name]) => name);
        
        const artist = topArtists[Math.floor(Math.random() * topArtists.length)];
        const query = `${artist}`;
        
        const response = await fetch(`${backendUrl}/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        forYouTracks = data.tracks?.items?.slice(0, 6) || [];
      }
      
      else if (likedSongs.length > 0) {
        const randomLiked = likedSongs[Math.floor(Math.random() * likedSongs.length)];
        const artist = randomLiked.artists?.[0]?.name || '';
        const query = `${artist}`;
        
        const response = await fetch(`${backendUrl}/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        forYouTracks = data.tracks?.items?.slice(0, 6) || [];
      }
      
      else {
        const response = await fetch(`${backendUrl}/api/search?q=${encodeURIComponent('trending music 2024')}`);
        const data = await response.json();
        forYouTracks = data.tracks?.items?.slice(0, 6) || [];
      }
      
      setForYou(forYouTracks);
      
      
      const trendingRes = await fetch(`${backendUrl}/api/search?q=${encodeURIComponent('top hits 2024')}`);
      const trendingData = await trendingRes.json();
      setTrending(trendingData.tracks?.items?.slice(0, 6) || []);
      
      
      if (likedSongs.length > 0 || listeningHistory.length > 0) {
        
        const allTracks = [...likedSongs];
        const historyTracks = listeningHistory.map(h => ({
          name: h.trackName,
          artists: h.artists,
          album: h.album,
          duration_ms: h.duration_ms
        }));
        
        
        const artistCounts = {};
        let totalDuration = 0;
        
        
        listeningHistory.forEach(entry => {
          entry.artists?.forEach(artist => {
            artistCounts[artist.name] = (artistCounts[artist.name] || 0) + 1;
          });
          totalDuration += entry.duration_ms || 0;
        });
        
        
        if (listeningHistory.length === 0) {
          likedSongs.forEach(track => {
            track.artists?.forEach(artist => {
              artistCounts[artist.name] = (artistCounts[artist.name] || 0) + 1;
            });
            totalDuration += track.duration_ms || 0;
          });
        }
        
        
        const topArtists = Object.entries(artistCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ 
            name, 
            playCount: count,
            images: [{ url: [...likedSongs, ...historyTracks].find(t => t.artists?.some(a => a.name === name))?.album?.images?.[0]?.url || '' }]
          }));
        
        setStats({
          totalMinutes: Math.floor((totalDuration / 1000 / 60)),
          topArtists,
          topGenres: ['electronic', 'pop', 'indie'], 
          tracksPlayed: listeningHistory.length || likedSongs.length,
          recentTracks: listeningHistory.slice(0, 5).map(h => ({ 
            track: {
              name: h.trackName,
              artists: h.artists,
              album: h.album
            }
          })),
          topTracks: likedSongs.slice(0, 5),
          totalArtists: Object.keys(artistCounts).length,
          averageTrackLength: (listeningHistory.length || likedSongs.length) > 0 
            ? Math.floor(totalDuration / (listeningHistory.length || likedSongs.length) / 1000 / 60) 
            : 0
        });
      }
      
      
      const genrePlaylists = [
        { name: 'chill vibes', query: 'chill music' },
        { name: 'workout mix', query: 'workout music' },
        { name: 'focus flow', query: 'focus music' },
        { name: 'party hits', query: 'party music' },
        { name: 'late night', query: 'late night music' },
        { name: 'morning coffee', query: 'morning music' },
        { name: 'study session', query: 'study music' },
        { name: 'road trip', query: 'road trip music' }
      ];
      
      const playlistPromises = genrePlaylists.map(async (playlist) => {
        const res = await fetch(`${backendUrl}/api/search?q=${encodeURIComponent(playlist.query)}`);
        const playlistData = await res.json();
        return {
          ...playlist,
          tracks: playlistData.tracks?.items?.slice(0, 8) || []
        };
      });
      
      const loadedPlaylists = await Promise.all(playlistPromises);
      setPlaylists(loadedPlaylists);
    } catch (error) {
      console.error('Error loading YT Music homepage:', error);
    }
  };

  const loadSpotifyHome = async () => {
    try {
      
      let forYouTracks = [];
      
      
      if (listeningHistory.length > 0) {
        
        const artistCounts = {};
        listeningHistory.forEach(entry => {
          entry.artists?.forEach(artist => {
            if (artist.id) artistCounts[artist.id] = (artistCounts[artist.id] || 0) + 1;
          });
        });
        
        
        const topArtistIds = Object.entries(artistCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([id]) => id)
          .filter(id => id);
        
        
        const recentTrackIds = listeningHistory
          .slice(0, 3)
          .map(h => h.trackId)
          .filter(id => id);
        
        if (topArtistIds.length > 0 || recentTrackIds.length > 0) {
          try {
            const seeds = [];
            if (topArtistIds.length > 0) seeds.push(`seed_artists=${topArtistIds.join(',')}`);
            if (recentTrackIds.length > 0) seeds.push(`seed_tracks=${recentTrackIds.join(',')}`);
            
            const recommendationsRes = await fetch(`https://api.spotify.com/v1/recommendations?${seeds.join('&')}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const recommendationsData = await recommendationsRes.json();
            forYouTracks = recommendationsData.tracks || [];
          } catch (err) {
            console.error('Error getting recommendations from history:', err);
          }
        }
      }
      
      
      if (forYouTracks.length === 0 && likedSongs.length > 0) {
        const seedTracks = likedSongs.slice(0, 5).map(t => t.id).filter(id => id).join(',');
        if (seedTracks) {
          try {
            const recommendationsRes = await fetch(`https://api.spotify.com/v1/recommendations?seed_tracks=${seedTracks}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const recommendationsData = await recommendationsRes.json();
            forYouTracks = recommendationsData.tracks || [];
          } catch (err) {
            console.error('Error getting recommendations from liked:', err);
          }
        }
      }
      
      
      if (forYouTracks.length === 0) {
        try {
          const topTracksRes = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=6&time_range=short_term', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const topTracksData = await topTracksRes.json();
          forYouTracks = topTracksData.items || [];
        } catch (err) {
          console.error('Error getting top tracks:', err);
        }
      }
      
      setForYou(forYouTracks);

      
      try {
        const topArtistsRes = await fetch('https://api.spotify.com/v1/me/top/artists?limit=50', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const topArtistsData = await topArtistsRes.json();

        const recentlyPlayedRes = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const recentlyPlayedData = await recentlyPlayedRes.json();

        
        const allTopTracksRes = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=50', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const allTopTracksData = await allTopTracksRes.json();

        
        const topTracksDuration = allTopTracksData.items?.reduce((acc, track) => acc + (track.duration_ms || 0), 0) || 0;
        
        const estimatedTotalMs = topTracksDuration * 10;
        const totalMinutes = Math.floor(estimatedTotalMs / 1000 / 60);
        
        
        const allGenres = topArtistsData.items?.flatMap(artist => artist.genres) || [];
        const genreCounts = {};
        allGenres.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
        const topGenres = Object.entries(genreCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([genre]) => genre);

        setStats({
          totalMinutes,
          topArtists: topArtistsData.items?.slice(0, 5) || [],
          topGenres,
          tracksPlayed: recentlyPlayedData.items?.length || 0,
          recentTracks: recentlyPlayedData.items?.slice(0, 5) || [],
          topTracks: allTopTracksData.items?.slice(0, 5) || [],
          totalArtists: topArtistsData.items?.length || 0,
          averageTrackLength: allTopTracksData.items?.length > 0 
            ? Math.floor(allTopTracksData.items.reduce((acc, t) => acc + (t.duration_ms || 0), 0) / allTopTracksData.items.length / 1000 / 60)
            : 0
        });
      } catch (err) {
        console.error('Error loading stats:', err);
      }
      
      
      const featuredRes = await fetch('https://api.spotify.com/v1/browse/featured-playlists?limit=1', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const featuredData = await featuredRes.json();
      
      if (featuredData.playlists?.items?.[0]) {
        const playlistId = featuredData.playlists.items[0].id;
        const playlistTracksRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=20`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const playlistTracksData = await playlistTracksRes.json();
        
        if (playlistTracksData.items) {
          setTrending(playlistTracksData.items.map(item => item.track));
        }
      }
      
      
      const userPlaylistsRes = await fetch('https://api.spotify.com/v1/me/playlists?limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userPlaylistsData = await userPlaylistsRes.json();
      
      if (userPlaylistsData.items) {
        const playlistsWithTracks = await Promise.all(
          userPlaylistsData.items.slice(0, 8).map(async (playlist) => {
            const tracksRes = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=6`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const tracksData = await tracksRes.json();
            
            return {
              name: playlist.name,
              tracks: tracksData.items?.map(item => item.track).filter(Boolean) || []
            };
          })
        );
        
        setPlaylists(playlistsWithTracks);
      }
    } catch (error) {
      console.error('Error loading Spotify homepage:', error);
      
      loadYTMusicHome();
    }
  };

  const handlePlayPlaylist = (playlist) => {
    if (playlist.tracks && playlist.tracks.length > 0) {
      onTrackSelect(playlist.tracks[0], playlist.tracks);
    }
  };

  if (loading) {
    return (
      <div className="homepage">
        <div className="homepage-overlay">
          <div className="homepage-header">
            <h1 className="homepage-logo">nova</h1>
            <div className="header-actions">
              <button className="header-btn" onClick={onOpenPlaylists}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15V6M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM12 12H3M16 6H3M12 18H3"/>
                </svg>
                playlists
              </button>
              <button className="header-btn" onClick={onOpenSettings}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1v6m0 6v6m8.66-10a9 9 0 0 1 0 8M3.34 7a9 9 0 0 0 0 8"/>
                </svg>
                settings
              </button>
            </div>
          </div>
          
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>loading your music...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleTrackClick = (track) => {
    onTrackSelect(track);
    setResults([]);
    setQuery('');
  };

  return (
    <div className="homepage">
      <div className="homepage-overlay">
        <div className="homepage-header">
          <h1 className="homepage-logo">nova</h1>
          <div className="header-actions">
            <button className="header-btn" onClick={onOpenPlaylists}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15V6M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM12 12H3M16 6H3M12 18H3"/>
              </svg>
              playlists
            </button>
            <button className="header-btn" onClick={onOpenSettings}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m8.66-10a9 9 0 0 1 0 8M3.34 7a9 9 0 0 0 0 8"/>
              </svg>
              settings
            </button>
          </div>
        </div>

        <div className="homepage-main">
          <div className="homepage-layout">
            <div className="homepage-left">
              <div className="search-bar-section">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="search for music..."
                  className="homepage-search-input"
                />
                {isSearching && <div className="search-loading">searching...</div>}
                {results.length > 0 && (
                  <div className="homepage-search-results">
                    {results.slice(0, 6).map((track) => (
                      <div
                        key={track.id}
                        className="homepage-result-item"
                        onClick={() => handleTrackClick(track)}
                      >
                        <img
                          src={track.album?.images?.[2]?.url || track.album?.images?.[0]?.url}
                          alt={track.name}
                          className="homepage-result-image"
                        />
                        <div className="homepage-result-info">
                          <div className="homepage-result-name">{track.name}</div>
                          <div className="homepage-result-artist">
                            {track.artists?.map((a) => a.name).join(', ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="homepage-content">
          {}
          {likedSongs.length > 0 && (
            <section className="home-section liked-section">
              <h2 className="section-title-home">your library</h2>
              <div className="liked-playlist-card" onClick={() => onOpenLikedSongs && onOpenLikedSongs()}>
                <div className="liked-playlist-cover">
                  <div className="liked-cover-grid">
                    {likedSongs.slice(0, 4).map((track, idx) => (
                      <img 
                        key={idx}
                        src={track.album?.images?.[0]?.url || '/placeholder.png'} 
                        alt=""
                        className="liked-cover-image"
                      />
                    ))}
                  </div>
                  <div className="liked-gradient-overlay"></div>
                  <div className="liked-heart-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </div>
                </div>
                <div className="liked-playlist-info">
                  <h3 className="liked-playlist-title">Liked Songs</h3>
                  <p className="liked-playlist-count">{likedSongs.length} song{likedSongs.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </section>
          )}

          {}
          <section className="home-section">
            <h2 className="section-title-home">made for you</h2>
            <div className="tracks-grid">
              {forYou.map((track, index) => (
                <div 
                  key={track.id || index} 
                  className="track-card"
                  onClick={() => onTrackSelect(track)}
                >
                  <div className="track-card-image-wrapper">
                    <img 
                      src={track.album?.images?.[0]?.url || '/placeholder.png'} 
                      alt={track.name}
                      className="track-card-image"
                    />
                    <div className="track-card-overlay">
                      <div className="play-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="track-card-info">
                    <div className="track-card-name">{track.name}</div>
                    <div className="track-card-artist">
                      {track.artists?.map(a => a.name).join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {}
          <section className="home-section">
            <h2 className="section-title-home">trending now</h2>
            <div className="tracks-grid">
              {trending.map((track, index) => (
                <div 
                  key={track.id || index} 
                  className="track-card"
                  onClick={() => onTrackSelect(track)}
                >
                  <div className="track-card-image-wrapper">
                    <img 
                      src={track.album?.images?.[0]?.url || '/placeholder.png'} 
                      alt={track.name}
                      className="track-card-image"
                    />
                    <div className="track-card-overlay">
                      <div className="play-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="track-card-info">
                    <div className="track-card-name">{track.name}</div>
                    <div className="track-card-artist">
                      {track.artists?.map(a => a.name).join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {}
          <section className="home-section">
            <h2 className="section-title-home">your playlists</h2>
            <div className="playlists-grid">
              {playlists.map((playlist, index) => (
                <div 
                  key={index} 
                  className="playlist-card"
                  onClick={() => handlePlayPlaylist(playlist)}
                >
                  <div className="playlist-header">
                    <h3 className="playlist-name">{playlist.name}</h3>
                  </div>
                  <div className="playlist-tracks">
                    {playlist.tracks.slice(0, 4).map((track, idx) => (
                      <div key={idx} className="playlist-track-mini">
                        <img 
                          src={track.album?.images?.[0]?.url || '/placeholder.png'} 
                          alt={track.name}
                          className="playlist-track-img"
                        />
                        <div className="playlist-track-info">
                          <div className="playlist-track-name">{track.name}</div>
                          <div className="playlist-track-artist">
                            {track.artists?.map(a => a.name).join(', ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="playlist-footer">
                    {playlist.tracks.length} songs
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
            </div>

        {}
        {stats && (
          <div className="homepage-stats">
            <h3 className="stats-title">your stats</h3>
            
            <div className="stat-card">
              <div className="stat-value">{stats.totalMinutes.toLocaleString()}</div>
              <div className="stat-label">minutes listened</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{stats.tracksPlayed}</div>
              <div className="stat-label">tracks played recently</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{stats.averageTrackLength}</div>
              <div className="stat-label">avg track length (min)</div>
            </div>

            {stats.topTracks && stats.topTracks.length > 0 && (
              <div className="stats-section">
                <h4 className="stats-section-title">top tracks</h4>
                <div className="top-tracks-list">
                  {stats.topTracks.map((track, index) => (
                    <div 
                      key={track.id} 
                      className="top-track-item"
                      onClick={() => onTrackSelect(track)}
                    >
                      <div className="track-rank">{index + 1}</div>
                      {track.album?.images?.[2] && (
                        <img 
                          src={track.album.images[2].url} 
                          alt={track.name}
                          className="track-image-tiny"
                        />
                      )}
                      <div className="track-info-tiny">
                        <div className="track-name-tiny">{track.name}</div>
                        <div className="track-artist-tiny">
                          {track.artists?.map(a => a.name).join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.topArtists.length > 0 && (
              <div className="stats-section">
                <h4 className="stats-section-title">top artists</h4>
                <div className="top-artists-list">
                  {stats.topArtists.map((artist, index) => (
                    <div key={artist.id} className="top-artist-item">
                      <div className="artist-rank">{index + 1}</div>
                      {artist.images?.[0] && (
                        <img 
                          src={artist.images[0].url} 
                          alt={artist.name}
                          className="artist-image-small"
                        />
                      )}
                      <div className="artist-name-small">{artist.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.topGenres.length > 0 && (
              <div className="stats-section">
                <h4 className="stats-section-title">top genres</h4>
                <div className="genre-tags">
                  {stats.topGenres.map((genre, index) => (
                    <span key={index} className="genre-tag">{genre}</span>
                  ))}
                </div>
              </div>
            )}

            {stats.recentTracks.length > 0 && (
              <div className="stats-section">
                <h4 className="stats-section-title">recently played</h4>
                <div className="recent-tracks-list">
                  {stats.recentTracks.map((item, index) => (
                    <div 
                      key={index} 
                      className="recent-track-item"
                      onClick={() => onTrackSelect(item.track)}
                    >
                      <img 
                        src={item.track?.album?.images?.[2]?.url || item.track?.album?.images?.[0]?.url} 
                        alt={item.track?.name}
                        className="recent-track-image"
                      />
                      <div className="recent-track-info">
                        <div className="recent-track-name">{item.track?.name}</div>
                        <div className="recent-track-artist">
                          {item.track?.artists?.map(a => a.name).join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
          </div>
        </div>

        {}
        {currentTrack && (
          <div className="now-playing-mini-home" onClick={onShowPlayer}>
            <img 
              src={currentTrack.album?.images?.[0]?.url || currentTrack.album?.images?.[2]?.url} 
              alt={currentTrack.name} 
              className="mini-album-art-home" 
            />
            <div className="mini-track-info-home">
              <div className="mini-track-name-home">{currentTrack.name}</div>
              <div className="mini-track-artist-home">{currentTrack.artists?.map(a => a.name).join(', ')}</div>
            </div>
            <div className="mini-playing-indicator-home">
              <div className="mini-bar"></div>
              <div className="mini-bar"></div>
              <div className="mini-bar"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
