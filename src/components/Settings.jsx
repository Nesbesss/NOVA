import { useState, useEffect } from 'react';

const BACKGROUNDS = [
  { id: 'red', name: 'Red & Black', gradient: 'linear-gradient(135deg, #000000 0%, #1a0000 25%, #330000 50%, #1a0000 75%, #000000 100%)' },
  { id: 'blue', name: 'Blue & Black', gradient: 'linear-gradient(135deg, #000000 0%, #001a33 25%, #003366 50%, #001a33 75%, #000000 100%)' },
  { id: 'purple', name: 'Purple & Black', gradient: 'linear-gradient(135deg, #000000 0%, #1a0033 25%, #330066 50%, #1a0033 75%, #000000 100%)' },
  { id: 'green', name: 'Green & Black', gradient: 'linear-gradient(135deg, #000000 0%, #001a00 25%, #003300 50%, #001a00 75%, #000000 100%)' },
  { id: 'orange', name: 'Orange & Black', gradient: 'linear-gradient(135deg, #000000 0%, #331a00 25%, #663300 50%, #331a00 75%, #000000 100%)' },
  { id: 'pink', name: 'Pink & Black', gradient: 'linear-gradient(135deg, #000000 0%, #330019 25%, #660033 50%, #330019 75%, #000000 100%)' },
  { id: 'cyan', name: 'Cyan & Black', gradient: 'linear-gradient(135deg, #000000 0%, #001a33 25%, #003366 50%, #001a33 75%, #000000 100%)' },
  { id: 'yellow', name: 'Yellow & Black', gradient: 'linear-gradient(135deg, #000000 0%, #333300 25%, #666600 50%, #333300 75%, #000000 100%)' },
  { id: 'white', name: 'White & Gray', gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 25%, #404040 50%, #2d2d2d 75%, #1a1a1a 100%)' },
  { id: 'teal', name: 'Teal & Black', gradient: 'linear-gradient(135deg, #000000 0%, #001a1a 25%, #003333 50%, #001a1a 75%, #000000 100%)' },
  { id: 'magenta', name: 'Magenta & Black', gradient: 'linear-gradient(135deg, #000000 0%, #330033 25%, #660066 50%, #330033 75%, #000000 100%)' },
  { id: 'lime', name: 'Lime & Black', gradient: 'linear-gradient(135deg, #000000 0%, #1a3300 25%, #336600 50%, #1a3300 75%, #000000 100%)' },
  { id: 'navy', name: 'Navy & Black', gradient: 'linear-gradient(135deg, #000000 0%, #000033 25%, #000066 50%, #000033 75%, #000000 100%)' },
  { id: 'maroon', name: 'Maroon & Black', gradient: 'linear-gradient(135deg, #000000 0%, #330000 25%, #660000 50%, #330000 75%, #000000 100%)' },
  { id: 'olive', name: 'Olive & Black', gradient: 'linear-gradient(135deg, #000000 0%, #333300 25%, #666600 50%, #333300 75%, #000000 100%)' },
  { id: 'indigo', name: 'Indigo & Black', gradient: 'linear-gradient(135deg, #000000 0%, #1a0033 25%, #330066 50%, #1a0033 75%, #000000 100%)' },
  { id: 'coral', name: 'Coral & Black', gradient: 'linear-gradient(135deg, #000000 0%, #331a0d 25%, #66331a 50%, #331a0d 75%, #000000 100%)' },
  { id: 'violet', name: 'Violet & Black', gradient: 'linear-gradient(135deg, #000000 0%, #1a0033 25%, #330066 50%, #1a0033 75%, #000000 100%)' },
  { id: 'crimson', name: 'Crimson & Black', gradient: 'linear-gradient(135deg, #000000 0%, #330011 25%, #660022 50%, #330011 75%, #000000 100%)' },
  { id: 'gold', name: 'Gold & Black', gradient: 'linear-gradient(135deg, #000000 0%, #332200 25%, #664400 50%, #332200 75%, #000000 100%)' },
];

export default function Settings({ onClose, onLogout, useYTMusic, onToggleMusicSource }) {
  const [selectedBg, setSelectedBg] = useState('red');

  useEffect(() => {
    const saved = localStorage.getItem('bg_theme');
    if (saved) setSelectedBg(saved);
  }, []);

  const handleBgChange = (bgId) => {
    setSelectedBg(bgId);
    localStorage.setItem('bg_theme', bgId);
    const bg = BACKGROUNDS.find(b => b.id === bgId);
    document.documentElement.style.setProperty('--search-gradient', bg.gradient);
  };

  return (
    <div className="settings-screen">
      <div className="settings-overlay">
        <div className="settings-content">
          <div className="settings-header">
            <h1 className="settings-title">settings</h1>
            <button className="close-button" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="settings-section">
            <h2 className="section-title">background theme</h2>
            <div className="bg-grid">
              {BACKGROUNDS.map((bg) => (
                <div
                  key={bg.id}
                  className={`bg-option ${selectedBg === bg.id ? 'active' : ''}`}
                  onClick={() => handleBgChange(bg.id)}
                >
                  <div className="bg-preview" style={{ background: bg.gradient }}></div>
                  <span className="bg-name">{bg.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <h2 className="section-title">music source</h2>
            <div className="music-source-toggle">
              <button 
                className={`source-btn ${!useYTMusic ? 'active' : ''}`}
                onClick={() => onToggleMusicSource(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                spotify
              </button>
              <button 
                className={`source-btn ${useYTMusic ? 'active' : ''}`}
                onClick={() => onToggleMusicSource(true)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                youtube music
              </button>
            </div>
            <p className="source-note">
              {useYTMusic ? '✓ Free access without ads' : '✓ Requires Spotify Premium'}
            </p>
          </div>

          <div className="settings-section">
            <h2 className="section-title">account</h2>
            <button className="logout-btn" onClick={onLogout}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
