import { useState, useEffect, useRef } from 'react';
import { redirectToSpotifyAuth, getToken, getCodeFromUrl, playTrack } from './spotify';
import { checkBackendHealth, getTrackStreamUrl } from './ytmusicApi';
import SearchBar from './components/SearchBar';
import Player from './components/Player';
import YTMusicPlayer from './components/YTMusicPlayer';
import Settings from './components/Settings';
import PlaylistCreator from './components/PlaylistCreator';
import LikedSongsView from './components/LikedSongsView';
import ArtistView from './components/ArtistView';
import ShareView from './components/ShareView';
import Homepage from './components/Homepage';
import './App.css';

function App() {
  const [token, setToken] = useState('');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [showLikedSongs, setShowLikedSongs] = useState(false);
  const [showArtist, setShowArtist] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [playlist, setPlaylist] = useState(null);
  const [playlistIndex, setPlaylistIndex] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [useYTMusic, setUseYTMusic] = useState(import.meta.env.VITE_USE_YTMUSIC === 'true');
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [ytAudioUrl, setYtAudioUrl] = useState(null);
  const [isYtPlaying, setIsYtPlaying] = useState(false);
  const [loopMode, setLoopMode] = useState(1); 
  const [listeningHistory, setListeningHistory] = useState(() => {
    const saved = localStorage.getItem('listening_history');
    return saved ? JSON.parse(saved) : [];
  });
  const ytAudioRef = useRef(null);
  const trackStartTime = useRef(null);
  const currentTrackRef = useRef(null);

  
  useEffect(() => {
    localStorage.setItem('listening_history', JSON.stringify(listeningHistory));
  }, [listeningHistory]);

  
  useEffect(() => {
    if (currentTrack) {
      trackStartTime.current = Date.now();
      currentTrackRef.current = currentTrack;

      const timer = setTimeout(() => {
        
        const historyEntry = {
          trackId: currentTrack.id,
          trackName: currentTrack.name,
          artist: currentTrack.artists?.[0]?.name || 'Unknown',
          artists: currentTrack.artists || [],
          album: currentTrack.album,
          duration_ms: currentTrack.duration_ms,
          playedAt: new Date().toISOString(),
          timestamp: Date.now()
        };

        setListeningHistory(prev => {
          
          const updated = [historyEntry, ...prev].slice(0, 500);
          return updated;
        });
      }, 30000); 

      return () => clearTimeout(timer);
    }
  }, [currentTrack]);

  useEffect(() => {
    if (useYTMusic && currentTrack && backendAvailable) {
      const videoId = currentTrack.id;
      const streamUrl = `${import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5001`}/api/stream/${videoId}`;
      setYtAudioUrl(streamUrl);
    }
  }, [currentTrack, useYTMusic, backendAvailable]);

  useEffect(() => {
    if (ytAudioRef.current && ytAudioUrl) {
      ytAudioRef.current.src = ytAudioUrl;
      ytAudioRef.current.load();
      const playPromise = ytAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('YouTube Music playback started');
            setIsYtPlaying(true);
          })
          .catch(err => {
            console.error('Playback failed:', err);
            setIsYtPlaying(false);
          });
      }
    }
  }, [ytAudioUrl]);

  useEffect(() => {
    
    const urlParams = new URLSearchParams(window.location.search);
    const playlistShareId = urlParams.get('playlist');
    
    if (playlistShareId) {
      console.log('[PLAYLIST SHARE] Loading playlist:', playlistShareId);
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5001`;
      
      fetch(`${backendUrl}/api/playlist/${playlistShareId}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch playlist');
          return res.json();
        })
        .then(playlistData => {
          console.log('[PLAYLIST SHARE] Received data:', playlistData);
          
          
          window.history.replaceState({}, document.title, '/');
          
          
          const PLAYLISTS_KEY = 'nova_playlists';
          const existingPlaylists = JSON.parse(localStorage.getItem(PLAYLISTS_KEY) || '[]');
          console.log('[PLAYLIST SHARE] Current playlists:', existingPlaylists);
          
          
          const alreadyExists = existingPlaylists.some(p => p.name === playlistData.name);
          
          if (alreadyExists) {
            console.log('[PLAYLIST SHARE] Playlist already exists');
            alert(`You already have "${playlistData.name}" in your collection!`);
            setShowPlaylists(true);
            return;
          }
          
          
          const newPlaylist = {
            id: 'nova_playlist_' + Date.now(),
            name: playlistData.name,
            description: playlistData.description || '',
            tracks: playlistData.tracks || [],
            createdAt: Date.now()
          };
          
          existingPlaylists.push(newPlaylist);
          localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(existingPlaylists));
          console.log('[PLAYLIST SHARE] Saved playlist:', newPlaylist);
          console.log('[PLAYLIST SHARE] Total playlists now:', existingPlaylists.length);
          
          
          window.dispatchEvent(new StorageEvent('storage', {
            key: PLAYLISTS_KEY,
            newValue: JSON.stringify(existingPlaylists),
            url: window.location.href
          }));
          
          
          alert(`✓ Added "${playlistData.name}" to your collection!`);
          
          
          setTimeout(() => {
            setShowPlaylists(true);
          }, 200);
        })
        .catch(err => {
          console.error('[PLAYLIST SHARE] Error:', err);
          alert(`Failed to load playlist: ${err.message}`);
          alert(`Failed to load playlist: ${err.message}`);
        });
    }
    
    
    const hash = window.location.hash;
    if (hash.startsWith('#share/')) {
      try {
        const encodedData = hash.substring(7); 
        const data = JSON.parse(decodeURIComponent(atob(encodedData)));
        setShareData(data);
        setShowShare(true);
        
        window.location.hash = '';
      } catch (e) {
        console.error('Invalid share link:', e);
      }
    }

    
    if (useYTMusic) {
      checkBackendHealth().then(available => {
        setBackendAvailable(available);
        if (!available) {
          console.warn('YouTube Music backend not available, falling back to Spotify');
          setUseYTMusic(false);
        }
      });
    }

    const code = getCodeFromUrl();

    if (code) {
      getToken(code).then(data => {
        if (data.access_token) {
          setToken(data.access_token);
          localStorage.setItem('spotify_token', data.access_token);
          window.history.replaceState({}, document.title, '/');
        }
      });
    } else {
      const storedToken = localStorage.getItem('spotify_token');
      if (storedToken) {
        setToken(storedToken);
      }
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    
    const backendUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5001`;
    fetch(`${backendUrl}/api/set-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    }).catch(err => console.log('Could not send token to backend:', err));

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Nova',
        getOAuthToken: (cb) => {
          cb(token);
        },
        volume: 0.5,
      });

      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
      });

      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
      });

      player.addListener('initialization_error', ({ message }) => {
        console.error('Failed to initialize', message);
      });

      player.addListener('authentication_error', ({ message }) => {
        console.error('Failed to authenticate', message);
        localStorage.removeItem('spotify_token');
        setToken('');
      });

      player.addListener('account_error', ({ message }) => {
        console.error('Failed to validate Spotify account', message);
      });

      player.connect();
      setPlayer(player);
    };
  }, [token]);

    const handleTrackSelect = async (track, customPlaylist = null) => {
    setCurrentTrack(track);
    setShowPlayer(true);
    
    
    if (customPlaylist && customPlaylist.length > 0) {
      setPlaylist(customPlaylist);
      const trackIndex = customPlaylist.findIndex(t => t.id === track.id);
      setPlaylistIndex(trackIndex >= 0 ? trackIndex : 0);
      console.log('🎵 Playing custom playlist with', customPlaylist.length, 'tracks');
    }
    
    else if (useYTMusic && backendAvailable) {
      
      fetchRecommendations(track);
    }
    
    if (useYTMusic) {
      return;
    }

    if (!deviceId) {
      console.log('No device ID yet');
      return;
    }

    try {
      await playTrack(track.uri, token, deviceId);
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  const fetchRecommendations = async (track) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5001`;
      const response = await fetch(`${backendUrl}/api/recommendations/${track.id}`);
      const data = await response.json();
      
      if (data.tracks && data.tracks.length > 0) {
        
        
        if (!playlist || playlist.length === 0 || playlist[0].id !== track.id) {
          const newPlaylist = [track, ...data.tracks];
          setPlaylist(newPlaylist);
          setPlaylistIndex(0);
          console.log('✓ Auto-generated playlist with', data.tracks.length, 'recommendations');
        }
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const handleNextTrack = () => {
    if (playlist && playlist.length > 0) {
      if (playlistIndex < playlist.length - 1) {
        
        const nextIndex = playlistIndex + 1;
        const nextTrack = playlist[nextIndex];
        setPlaylistIndex(nextIndex);
        setCurrentTrack(nextTrack);
        
        
        if (useYTMusic && nextIndex >= playlist.length - 3) {
          fetchRecommendations(nextTrack);
        }
      } else if (loopMode === 1) {
        
        const nextTrack = playlist[0];
        setPlaylistIndex(0);
        setCurrentTrack(nextTrack);
        console.log('🔁 Looping back to start of playlist');
      }
      
    }
  };

  const handlePreviousTrack = () => {
    if (playlist && playlistIndex > 0) {
      const prevIndex = playlistIndex - 1;
      const prevTrack = playlist[prevIndex];
      setPlaylistIndex(prevIndex);
      setCurrentTrack(prevTrack);
    }
  };

  const loginWithSpotify = () => {
    const authUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${SCOPES.join('%20')}`;
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    localStorage.removeItem('spotify_token');
    setToken('');
    setCurrentTrack(null);
    setUseYTMusic(false);
    if (player) {
      player.disconnect();
    }
    setShowSettings(false);
    setShowPlaylists(false);
    setShowPlayer(false);
  };

  const handleToggleMusicSource = (enableYTMusic) => {
    if (enableYTMusic && backendAvailable) {
      setUseYTMusic(true);
      
      if (player) {
        player.disconnect();
      }
      setCurrentTrack(null);
      setShowPlayer(false);
    } else if (!enableYTMusic) {
      setUseYTMusic(false);
      
      setCurrentTrack(null);
      setShowPlayer(false);
    }
  };

  const handleArtistClick = (artist) => {
    setSelectedArtist(artist);
    setShowArtist(true);
  };

  useEffect(() => {
    const savedBg = localStorage.getItem('bg_theme') || 'red';
    const backgrounds = {
      red: 'linear-gradient(135deg, #000000 0%, #1a0000 25%, #330000 50%, #1a0000 75%, #000000 100%)',
      blue: 'linear-gradient(135deg, #000000 0%, #001a33 25%, #003366 50%, #001a33 75%, #000000 100%)',
      purple: 'linear-gradient(135deg, #000000 0%, #1a0033 25%, #330066 50%, #1a0033 75%, #000000 100%)',
      green: 'linear-gradient(135deg, #000000 0%, #001a00 25%, #003300 50%, #001a00 75%, #000000 100%)',
      orange: 'linear-gradient(135deg, #000000 0%, #331a00 25%, #663300 50%, #331a00 75%, #000000 100%)',
      pink: 'linear-gradient(135deg, #000000 0%, #330019 25%, #660033 50%, #330019 75%, #000000 100%)',
      cyan: 'linear-gradient(135deg, #000000 0%, #001a33 25%, #003366 50%, #001a33 75%, #000000 100%)',
      yellow: 'linear-gradient(135deg, #000000 0%, #333300 25%, #666600 50%, #333300 75%, #000000 100%)',
      white: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 25%, #404040 50%, #2d2d2d 75%, #1a1a1a 100%)',
      teal: 'linear-gradient(135deg, #000000 0%, #001a1a 25%, #003333 50%, #001a1a 75%, #000000 100%)',
      magenta: 'linear-gradient(135deg, #000000 0%, #330033 25%, #660066 50%, #330033 75%, #000000 100%)',
      lime: 'linear-gradient(135deg, #000000 0%, #1a3300 25%, #336600 50%, #1a3300 75%, #000000 100%)',
      navy: 'linear-gradient(135deg, #000000 0%, #000033 25%, #000066 50%, #000033 75%, #000000 100%)',
      maroon: 'linear-gradient(135deg, #000000 0%, #330000 25%, #660000 50%, #330000 75%, #000000 100%)',
      olive: 'linear-gradient(135deg, #000000 0%, #333300 25%, #666600 50%, #333300 75%, #000000 100%)',
      indigo: 'linear-gradient(135deg, #000000 0%, #1a0033 25%, #330066 50%, #1a0033 75%, #000000 100%)',
      coral: 'linear-gradient(135deg, #000000 0%, #331a0d 25%, #66331a 50%, #331a0d 75%, #000000 100%)',
      violet: 'linear-gradient(135deg, #000000 0%, #1a0033 25%, #330066 50%, #1a0033 75%, #000000 100%)',
      crimson: 'linear-gradient(135deg, #000000 0%, #330011 25%, #660022 50%, #330011 75%, #000000 100%)',
      gold: 'linear-gradient(135deg, #000000 0%, #332200 25%, #664400 50%, #332200 75%, #000000 100%)',
    };
    document.documentElement.style.setProperty('--search-gradient', backgrounds[savedBg]);
  }, []);

  if (!token && !useYTMusic) {
    return (
      <div className="login-container">
        <div className="login-content">
          <h1 className="app-title">nova</h1>
          <p className="app-subtitle">choose your music source</p>
          
          <div className="login-options">
            <button 
              className="login-button spotify-btn"
              onClick={redirectToSpotifyAuth}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <div className="btn-text">
                <span className="btn-title">Spotify Premium</span>
                <span className="btn-subtitle">Full features with premium account</span>
              </div>
            </button>

            <div className="or-divider">
              <span>or</span>
            </div>

            <button 
              className="login-button youtube-btn"
              onClick={() => {
                setUseYTMusic(true);
                setToken('ytmusic'); 
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <div className="btn-text">
                <span className="btn-title">YouTube Music</span>
                <span className="btn-subtitle">100% Free • No Ads • No Login Required</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {}
      {useYTMusic && (
        <audio ref={ytAudioRef} style={{ display: 'none' }} />
      )}

      {showSettings && (
        <Settings 
          onClose={() => setShowSettings(false)} 
          onLogout={handleLogout} 
          useYTMusic={useYTMusic}
          onToggleMusicSource={handleToggleMusicSource}
        />
      )}
      
      {showPlaylists && (
        <PlaylistCreator 
          token={token} 
          onClose={() => setShowPlaylists(false)}
          onPlayTrack={handleTrackSelect}
        />
      )}

      {showLikedSongs && (
        <LikedSongsView 
          onClose={() => setShowLikedSongs(false)}
          onPlayTrack={handleTrackSelect}
        />
      )}

      {showArtist && selectedArtist && (
        <ArtistView 
          artist={selectedArtist}
          token={token}
          onClose={() => {
            setShowArtist(false);
            setSelectedArtist(null);
          }}
          onTrackSelect={handleTrackSelect}
          useYTMusic={useYTMusic && backendAvailable}
        />
      )}

      {showShare && shareData && (
        <ShareView 
          shareData={shareData}
          onClose={() => {
            setShowShare(false);
            setShareData(null);
          }}
          onPlayTrack={handleTrackSelect}
        />
      )}
      
      {showPlayer && currentTrack && !showSettings && !showPlaylists && !showLikedSongs && !showArtist && !showShare ? (
        useYTMusic && backendAvailable ? (
          <YTMusicPlayer 
            currentTrack={currentTrack} 
            token={token}
            onBack={() => setShowPlayer(false)}
            onNextTrack={handleNextTrack}
            onPreviousTrack={handlePreviousTrack}
            hasNext={playlist && (playlistIndex < playlist.length - 1 || loopMode === 1)}
            hasPrevious={playlist && playlistIndex > 0}
            useYTMusic={true}
            audioRef={ytAudioRef}
            isPlaying={isYtPlaying}
            setIsPlaying={setIsYtPlaying}
            loopMode={loopMode}
            setLoopMode={setLoopMode}
            onArtistClick={handleArtistClick}
          />
        ) : (
          <Player 
            currentTrack={currentTrack} 
            token={token} 
            player={player} 
            onBack={() => setShowPlayer(false)}
            onNextTrack={handleNextTrack}
            onPreviousTrack={handlePreviousTrack}
            hasNext={playlist && playlistIndex < playlist.length - 1}
            hasPrevious={playlist && playlistIndex > 0}
            onArtistClick={handleArtistClick}
          />
        )
      ) : !showSettings && !showPlaylists && !showLikedSongs && !showArtist ? (
        showSearch ? (
          <SearchBar 
            token={token} 
            onTrackSelect={handleTrackSelect}
            onOpenSettings={() => setShowSettings(true)}
            onOpenPlaylists={() => setShowPlaylists(true)}
            currentTrack={currentTrack}
            onShowPlayer={() => setShowPlayer(true)}
            useYTMusic={useYTMusic && backendAvailable}
            onBack={() => setShowSearch(false)}
          />
        ) : (
          <Homepage
            token={token}
            onTrackSelect={handleTrackSelect}
            useYTMusic={useYTMusic && backendAvailable}
            onOpenSettings={() => setShowSettings(true)}
            onOpenPlaylists={() => setShowPlaylists(true)}
            onOpenLikedSongs={() => setShowLikedSongs(true)}
            onOpenSearch={() => setShowSearch(true)}
            currentTrack={currentTrack}
            onShowPlayer={() => setShowPlayer(true)}
            listeningHistory={listeningHistory}
          />
        )
      ) : null}
    </>
  );
}

export default App;
