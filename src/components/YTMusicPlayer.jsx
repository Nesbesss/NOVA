import { useState, useEffect } from 'react';

export default function YTMusicPlayer({ 
  currentTrack, 
  onBack, 
  onNextTrack, 
  onPreviousTrack, 
  hasNext, 
  hasPrevious, 
  audioRef,
  isPlaying,
  setIsPlaying
}) {
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setPosition(audio.currentTime);
    const updateDuration = () => {
      if (isNaN(audio.duration) && currentTrack?.duration_ms) {
        setDuration(currentTrack.duration_ms / 1000);
      } else {
        setDuration(audio.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded, duration:', audio.duration);
      updateDuration();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', updateDuration);

    if (currentTrack?.duration_ms) {
      setDuration(currentTrack.duration_ms / 1000);
    }

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', updateDuration);
    };
  }, [currentTrack]);

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
    if (onNextTrack && hasNext) {
      onNextTrack();
    }
  };

  const handlePrevious = () => {
    if (onPreviousTrack && hasPrevious) {
      onPreviousTrack();
    }
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
      </div>
    </div>
  );
}
