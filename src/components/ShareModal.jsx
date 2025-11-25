import { useState } from 'react';

export default function ShareModal({ track, onClose }) {
  const [copied, setCopied] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [audio] = useState(track?.preview_url ? new Audio(track.preview_url) : null);

  
  const trackData = {
    id: track.id,
    name: track.name,
    artist: track.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
    image: track.album?.images?.[0]?.url || '',
    preview: track.preview_url || '',
    spotify: track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`
  };
  
  
  
  const encodedData = btoa(encodeURIComponent(JSON.stringify(trackData)));
  const shareUrl = `${window.location.origin}/#share/${encodedData}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayPreview = () => {
    if (!audio) return;
    
    if (previewPlaying) {
      audio.pause();
      audio.currentTime = 0;
      setPreviewPlaying(false);
    } else {
      audio.play();
      setPreviewPlaying(true);
      
      audio.onended = () => {
        setPreviewPlaying(false);
      };
    }
  };

  const handleClose = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    onClose();
  };

  return (
    <div className="share-modal-overlay" onClick={handleClose}>
      <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="share-close-btn" onClick={handleClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="share-header">
          <h2>share track</h2>
        </div>

        <div className="share-track-info">
          <img 
            src={track.album?.images?.[0]?.url || '/placeholder.png'} 
            alt={track.name}
            className="share-track-image"
          />
          <div className="share-track-details">
            <div className="share-track-name">{track.name}</div>
            <div className="share-track-artist">
              {track.artists?.map(a => a.name).join(', ')}
            </div>
          </div>
        </div>

        {audio && (
          <button 
            className={`preview-btn ${previewPlaying ? 'playing' : ''}`}
            onClick={handlePlayPreview}
          >
            {previewPlaying ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
                <span>stop preview</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <span>play preview (30s)</span>
              </>
            )}
          </button>
        )}

        <div className="share-link-container">
          <input 
            type="text" 
            value={shareUrl} 
            readOnly 
            className="share-link-input"
          />
          <button 
            className={`copy-link-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopyLink}
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>copied!</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>copy link</span>
              </>
            )}
          </button>
        </div>

        <div className="share-info">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>share link with friends - they can listen to preview & open in Spotify</span>
        </div>
      </div>
    </div>
  );
}
