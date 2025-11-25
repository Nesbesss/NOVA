

const LIKED_SONGS_KEY = 'nova_liked_songs';
const PLAYLISTS_KEY = 'nova_playlists';

export const getLikedSongs = () => {
  const liked = localStorage.getItem(LIKED_SONGS_KEY);
  return liked ? JSON.parse(liked) : [];
};

export const isTrackLiked = (trackId) => {
  const liked = getLikedSongs();
  return liked.some(track => track.id === trackId);
};

export const likeTrack = (trackId, trackData) => {
  const liked = getLikedSongs();
  if (!liked.some(track => track.id === trackId)) {
    liked.unshift(trackData); 
    localStorage.setItem(LIKED_SONGS_KEY, JSON.stringify(liked));
  }
};

export const unlikeTrack = (trackId) => {
  const liked = getLikedSongs();
  const filtered = liked.filter(track => track.id !== trackId);
  localStorage.setItem(LIKED_SONGS_KEY, JSON.stringify(filtered));
};

export const getPlaylists = () => {
  const playlists = localStorage.getItem(PLAYLISTS_KEY);
  return playlists ? JSON.parse(playlists) : [];
};

export const createPlaylist = (name, description = '') => {
  const playlists = getPlaylists();
  const newPlaylist = {
    id: `nova_playlist_${Date.now()}`,
    name,
    description,
    tracks: [],
    created: new Date().toISOString(),
    image: null
  };
  playlists.push(newPlaylist);
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  return newPlaylist;
};

export const addTrackToPlaylist = (playlistId, track) => {
  const playlists = getPlaylists();
  const playlist = playlists.find(p => p.id === playlistId);
  
  if (playlist) {
    
    if (!playlist.tracks.find(t => t.id === track.id)) {
      playlist.tracks.push({
        id: track.id,
        name: track.name,
        artists: track.artists,
        album: track.album,
        uri: track.uri,
        duration_ms: track.duration_ms,
        videoId: track.videoId || track.id
      });
      localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
    }
  }
};

export const removeTrackFromPlaylist = (playlistId, trackId) => {
  const playlists = getPlaylists();
  const playlist = playlists.find(p => p.id === playlistId);
  
  if (playlist) {
    playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  }
};

export const deletePlaylist = (playlistId) => {
  const playlists = getPlaylists();
  const filtered = playlists.filter(p => p.id !== playlistId);
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(filtered));
};

export const getPlaylist = (playlistId) => {
  const playlists = getPlaylists();
  return playlists.find(p => p.id === playlistId);
};

export const updatePlaylist = (playlistId, updates) => {
  const playlists = getPlaylists();
  const playlist = playlists.find(p => p.id === playlistId);
  
  if (playlist) {
    Object.assign(playlist, updates);
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  }
};
