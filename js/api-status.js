let apiStatusCache = null;

async function fetchApiStatus() {
  try {
    const response = await fetch('/api/api-status');
    if (!response.ok) return null;
    const status = await response.json();
    apiStatusCache = status;
    return status;
  } catch (err) {
    console.warn('API status check failed:', err);
    return null;
  }
}

function prefetchApiStatus() {
  fetchApiStatus();
}

function getApiStatusCache() {
  return apiStatusCache;
}

export { fetchApiStatus, prefetchApiStatus, getApiStatusCache };