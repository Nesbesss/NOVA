import { useState, useEffect } from 'react';

export default function ShareView({ shareData, onClose, onPlayTrack }) {
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [audio] = useState(shareData?.preview ? new Audio(shareData.preview) : null);

  useEffect(() => {
    
    if (shareData) {
      document.title = `${shareData.name} - ${shareData.artist} | NOVA`;
      
      
      document.documentElement.style.setProperty('--share-bg-image', `url(${shareData.image})`);
      
      
      updateMetaTag('og:title', shareData.name);
      updateMetaTag('og:description', `${shareData.artist} - Listen on NOVA`);
      updateMetaTag('og:image', shareData.image);
      updateMetaTag('twitter:title', shareData.name);
      updateMetaTag('twitter:description', `${shareData.artist} - Listen on NOVA`);
      updateMetaTag('twitter:image', shareData.image);
      
      if (shareData.preview) {
        updateMetaTag('og:audio', shareData.preview);
      }
    }
    
    return () => {
      document.title = 'NOVA';
      document.documentElement.style.removeProperty('--share-bg-image');
    };
  }, [shareData]);

  const updateMetaTag = (property, content) => {
    let tag = document.querySelector(`meta[property="${property}"]`) || 
              document.querySelector(`meta[name="${property}"]`);
    
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(property.includes(':') ? 'property' : 'name', property);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
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

  const handleOpenInNova = async () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    
    
    const track = {
      id: shareData.id,
      name: shareData.name,
      artists: shareData.artist.split(', ').map(name => ({ name })),
      album: {
        images: [{ url: shareData.image }]
      },
      preview_url: shareData.preview,
      external_urls: {
        spotify: shareData.spotify
      }
    };
    
    if (onPlayTrack) {
      onPlayTrack(track, [track]);
    }
    
    onClose();
  };

  const handleClose = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    onClose();
  };

  if (!shareData) {
    return null;
  }

  return (
    <div className="share-view-overlay" onClick={handleClose}>
      <div className="share-view-content" onClick={(e) => e.stopPropagation()}>
        <button className="share-close-btn" onClick={handleClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="share-view-logo">NOVA</div>

        <div className="share-view-track-info">
          <img 
            src={shareData.image || '/placeholder.png'} 
            alt={shareData.name}
            className="share-view-track-image"
          />
          <h1 className="share-view-track-name">{shareData.name}</h1>
          <div className="share-view-track-artist">{shareData.artist}</div>
        </div>

        <div className="share-view-actions">
          {audio && (
            <button 
              className={`share-view-btn preview ${previewPlaying ? 'playing' : ''}`}
              onClick={handlePlayPreview}
            >
              {previewPlaying ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                  <span>Stop Preview</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  <span>Play Preview (30s)</span>
                </>
              )}
            </button>
          )}

          <button 
            className="share-view-btn primary"
            onClick={handleOpenInNova}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>Open in NOVA</span>
          </button>

          <button 
            className="share-view-btn secondary"
            onClick={() => window.open(shareData.spotify, '_blank')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <span>Listen on Spotify</span>
          </button>
        </div>

        <div className="share-view-info">
          Someone shared this track with you
        </div>
      </div>
    </div>
  );
}
