export const API_BASE_URL = 'https://dash-production-b25c.up.railway.app';

export const getSessionKey = () => {
  return localStorage.getItem('session_key');
};

export const isAuthenticated = () => {
  return !!getSessionKey();
};

export const logout = () => {
  localStorage.removeItem('session_key');
  window.location.href = '/login';
};
