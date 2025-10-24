const getBackendUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (import.meta.env.PROD) {
    const url = new URL(window.location.origin);
    url.port = '5001';
    return url.toString().replace(/\/$/, '');
  }
  return 'http://localhost:5001';
};

const BACKEND_URL = getBackendUrl();

export const searchTracksYTMusic = async (query) => {
  const response = await fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Search failed');
  }
  return response.json();
};

export const getTrackStreamUrl = async (videoId) => {
  const response = await fetch(`${BACKEND_URL}/api/track/${videoId}`);
  if (!response.ok) {
    throw new Error('Failed to get track');
  }
  return response.json();
};

export const createYTMusicPlaylist = async (title, description, videoIds) => {
  const response = await fetch(`${BACKEND_URL}/api/playlist/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      description,
      video_ids: videoIds,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create playlist');
  }
  return response.json();
};

export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
};
