import { useState, useEffect } from 'react';
import { pausePlayback, resumePlayback, skipToNext, skipToPrevious } from '../spotify';

export default function Player({ currentTrack, token, player, onBack, onNextTrack, onPreviousTrack, hasNext, hasPrevious }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

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
