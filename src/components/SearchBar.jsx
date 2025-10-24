import { useState, useEffect } from 'react';
import { searchTracks } from '../spotify';
import { searchTracksYTMusic } from '../ytmusicApi';

export default function SearchBar({ token, onTrackSelect, onOpenSettings, onOpenPlaylists, currentTrack, onShowPlayer, useYTMusic = false }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Live search as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        let data;
        if (useYTMusic) {
          data = await searchTracksYTMusic(query);
        } else {
          data = await searchTracks(query, token);
        }
        setResults(data.tracks?.items || []);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(delayDebounce);
  }, [query, token, useYTMusic]);

  const handleTrackClick = (track) => {
    onTrackSelect(track);
    setResults([]);
    setQuery('');
  };

  return (
    <div className="search-screen">
      <div className="search-overlay">
        <div className="search-content">
          <div className="search-top-buttons">
            <button className="icon-button" onClick={onOpenSettings} title="Settings">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"></path>
              </svg>
            </button>
            <button className="icon-button" onClick={onOpenPlaylists} title="Playlists">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
          </div>

          {currentTrack && (
            <div className="now-playing-mini" onClick={onShowPlayer}>
              <img 
                src={currentTrack.album.images[0]?.url || currentTrack.album.images[2]?.url} 
                alt={currentTrack.name} 
                className="mini-album-art" 
              />
              <div className="mini-track-info">
                <div className="mini-track-name">{currentTrack.name}</div>
                <div className="mini-track-artist">{currentTrack.artists.map(a => a.name).join(', ')}</div>
              </div>
              <div className="mini-playing-indicator">
                <div className="mini-bar"></div>
                <div className="mini-bar"></div>
                <div className="mini-bar"></div>
              </div>
            </div>
          )}

          <h1 className="search-title">nova</h1>
          
          <div className="search-bar-wrapper">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search for music..."
              className="search-input-glass"
              autoFocus
            />
          </div>

          {isSearching && <div className="loading-text">searching...</div>}

          {results.length > 0 && (
            <div className="results-glass">
              {results.slice(0, 8).map((track) => (
                <div
                  key={track.id}
                  className="result-item-glass"
                  onClick={() => handleTrackClick(track)}
                >
                  <img
                    src={track.album.images[2]?.url || track.album.images[0]?.url}
                    alt={track.name}
                    className="result-image-glass"
                  />
                  <div className="result-info-glass">
                    <div className="result-name-glass">{track.name}</div>
                    <div className="result-artist-glass">
                      {track.artists.map((a) => a.name).join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
