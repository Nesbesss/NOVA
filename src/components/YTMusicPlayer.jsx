import { useState, useEffect, useRef } from 'react';

export default function YTMusicPlayer({ 
  currentTrack, 
  onBack, 
  onNextTrack, 
  onPreviousTrack, 
  hasNext, 
  hasPrevious, 
  audioRef,
  isPlaying,
  setIsPlaying,
  loopMode,
  setLoopMode
}) {
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyricsEnabled, setLyricsEnabled] = useState(false);
  const [lyrics, setLyrics] = useState('');
  const [lyricsSegments, setLyricsSegments] = useState([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const lyricsContainerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setPosition(audio.currentTime);
      
      // Update current lyric line based on time
      if (lyricsSegments.length > 0) {
        const currentTime = audio.currentTime;
        let foundIndex = -1;
        
        for (let i = lyricsSegments.length - 1; i >= 0; i--) {
          if (currentTime >= lyricsSegments[i].start) {
            foundIndex = i;
            break;
          }
        }
        
        setCurrentLyricIndex(foundIndex);
      }
    };
    
    const updateDuration = () => {
      if (isNaN(audio.duration) && currentTrack?.duration_ms) {
        setDuration(currentTrack.duration_ms / 1000);
      } else {
        setDuration(audio.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      console.log('Song ended, loop mode:', loopMode);
      
      if (loopMode === 2) {
        // Repeat one - replay current song
        audio.currentTime = 0;
        audio.play();
      } else if (loopMode === 1 || hasNext) {
        // Repeat all or has next song - play next
        handleNext();
      }
      // If loopMode === 0 and no next song, do nothing (song just ends)
    };
    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded, duration:', audio.duration);
      updateDuration();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', updateDuration);

    if (currentTrack?.duration_ms) {
      setDuration(currentTrack.duration_ms / 1000);
    }

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', updateDuration);
    };
  }, [currentTrack, lyricsSegments, loopMode, hasNext]);

  // Auto-scroll lyrics to keep current line centered
  useEffect(() => {
    if (lyricsEnabled && lyricsContainerRef.current && currentLyricIndex >= 0) {
      const container = lyricsContainerRef.current;
      const currentLine = container.children[currentLyricIndex];
      
      if (currentLine) {
        const containerHeight = container.clientHeight;
        const lineTop = currentLine.offsetTop;
        const lineHeight = currentLine.clientHeight;
        
        // Scroll to center the current line
        container.scrollTo({
          top: lineTop - containerHeight / 2 + lineHeight / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [currentLyricIndex, lyricsEnabled]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleNext = () => {
    if (onNextTrack) {
      // Always call onNextTrack if it exists
      // The parent component will handle whether there's actually a next track
      onNextTrack();
    }
  };

  const handlePrevious = () => {
    if (onPreviousTrack && hasPrevious) {
      onPreviousTrack();
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setPosition(newTime);
  };

  const toggleLoop = () => {
    setLoopMode((prev) => (prev + 1) % 3); // Cycle through 0 → 1 → 2 → 0
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) {
      if (currentTrack?.duration_ms) {
        seconds = currentTrack.duration_ms / 1000;
      } else {
        return '0:00';
      }
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleLyrics = async () => {
    if (!lyricsEnabled && !lyrics) {
      // First time enabling - fetch lyrics
      await fetchLyrics();
    }
    setLyricsEnabled(!lyricsEnabled);
  };

  const fetchLyrics = async () => {
    const videoId = currentTrack?.id || currentTrack?.videoId;
    if (!videoId) {
      console.log('No video ID found in track:', currentTrack);
      return;
    }
    
    console.log('Fetching lyrics for video ID:', videoId);
    setLoadingLyrics(true);
    setIsTranscribing(false);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
      const response = await fetch(`${backendUrl}/api/lyrics/${videoId}`);
      const data = await response.json();
      
      console.log('Lyrics response:', data);
      
      if (data.error) {
        setLyrics('Lyrics not available for this song.');
        setLyricsSegments([]);
      } else if (data.source === 'transcribing') {
        // Need to transcribe with Whisper
        setLyrics(data.lyrics);
        setLyricsSegments([]);
        setIsTranscribing(true);
        
        // Start transcription in background
        transcribeWithWhisper(videoId);
      } else {
        setLyrics(data.lyrics || 'Lyrics not available for this song.');
        setLyricsSegments(data.segments || []);
      }
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      setLyrics('Failed to load lyrics.');
      setLyricsSegments([]);
    } finally {
      setLoadingLyrics(false);
    }
  };

  const transcribeWithWhisper = async (videoId) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
      console.log('🎤 Starting Whisper transcription...');
      
      const response = await fetch(`${backendUrl}/api/lyrics/${videoId}/transcribe`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.error) {
        setLyrics('AI transcription failed. ' + data.error);
        setIsTranscribing(false);
      } else {
        setLyrics(data.lyrics);
        setLyricsSegments(data.segments || []);
        setIsTranscribing(false);
        console.log('✓ Transcription complete!');
      }
    } catch (error) {
      console.error('Error transcribing:', error);
      setLyrics('AI transcription failed.');
      setIsTranscribing(false);
    }
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
          <div className="player-main-section">
            <div className="player-image-wrapper">
              <img src={albumImage} alt={currentTrack.name} className="player-image-full" />
            </div>
            
            <div className="player-controls-wrapper">
              <div className="track-info">
                <div className="track-name-full">{currentTrack.name}</div>
                <div className="track-artist-full">
                  {currentTrack.artists.map((a) => a.name).join(', ')}
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
                <button className="control-btn" onClick={handlePrevious} disabled={!hasPrevious}>
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
                <button className="control-btn" onClick={handleNext} disabled={!hasNext}>
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
                  {showMenu && (
                    <div className="dropdown-menu">
                      <button 
                        className={`menu-item ${lyricsEnabled ? 'active' : ''}`}
                        onClick={() => {
                          toggleLyrics();
                          setShowMenu(false);
                        }}
                        disabled={loadingLyrics}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18V5l12-2v13"></path>
                          <circle cx="6" cy="18" r="3"></circle>
                          <circle cx="18" cy="16" r="3"></circle>
                        </svg>
                        <span>{lyricsEnabled ? 'Hide Lyrics' : 'Show Lyrics'}</span>
                      </button>
                      
                      <button 
                        className={`menu-item ${loopMode > 0 ? 'active' : ''}`}
                        onClick={() => {
                          toggleLoop();
                        }}
                      >
                        {loopMode === 2 ? (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 2l4 4-4 4"></path>
                              <path d="M3 11v-1a4 4 0 0 1 4-4h14"></path>
                              <path d="M7 22l-4-4 4-4"></path>
                              <path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
                              <text x="12" y="16" fontSize="10" fill="currentColor" textAnchor="middle" fontWeight="bold">1</text>
                            </svg>
                            <span>Repeat One</span>
                          </>
                        ) : loopMode === 1 ? (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 2l4 4-4 4"></path>
                              <path d="M3 11v-1a4 4 0 0 1 4-4h14"></path>
                              <path d="M7 22l-4-4 4-4"></path>
                              <path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
                            </svg>
                            <span>Repeat All</span>
                          </>
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 2l4 4-4 4"></path>
                              <path d="M3 11v-1a4 4 0 0 1 4-4h14"></path>
                              <path d="M7 22l-4-4 4-4"></path>
                              <path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
                            </svg>
                            <span>Loop: Off</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="progress-full">
                <span className="time-full">{formatTime(position)}</span>
                <div 
                  className="progress-bar-full"
                  onClick={handleSeek}
                  style={{ cursor: 'pointer' }}
                >
                  <div 
                    className="progress-fill-full" 
                    style={{ width: `${(position / duration) * 100}%` }}
                  />
                </div>
                <span className="time-full">{formatTime(duration)}</span>
              </div>
            </div>
          </div>
          
          {/* Inline Lyrics Display - Below everything */}
          {lyricsEnabled && (
            <div className="lyrics-inline-container">
              {isTranscribing && (
                <div className="lyrics-transcribing">
                  🎤 Transcribing with AI... This may take 10-20 seconds
                </div>
              )}
              <div className="lyrics-inline-scroll" ref={lyricsContainerRef}>
                {loadingLyrics ? (
                  <div className="lyrics-loading-inline">Loading lyrics...</div>
                ) : lyricsSegments.length > 0 ? (
                  // Karaoke-style synced lyrics
                  lyricsSegments.map((segment, index) => (
                    <div 
                      key={index}
                      className={`lyrics-line-inline ${index === currentLyricIndex ? 'active' : ''} ${index < currentLyricIndex ? 'past' : ''}`}
                    >
                      {segment.text}
                    </div>
                  ))
                ) : (
                  // Plain text lyrics
                  <div className="lyrics-plain-inline">{lyrics}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
