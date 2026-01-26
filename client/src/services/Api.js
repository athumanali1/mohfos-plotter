// Simple API client with configurable base URL for Android WebView builds
// Base URL resolution order:
// 1) window.API_BASE (set at runtime)
// 2) process.env.REACT_APP_API_BASE (set at build time)
// 3) '' (relative, works in CRA dev with proxy)

const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.API_BASE) return window.API_BASE;
  if (process.env.REACT_APP_API_BASE) return process.env.REACT_APP_API_BASE;
  return '';
};

const base = getBaseUrl();

const Api = {
  async analyze(question) {
    const response = await fetch(`${base}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || 'Analysis failed');
    return data;
  },
};

export default Api;
