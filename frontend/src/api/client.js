import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터: JWT 토큰 자동 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 응답 인터셉터: 401 처리
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url ?? '';
      const isAuthEndpoint =
        url.includes('/auth/login') ||
        url.includes('/auth/register');

      if (!isAuthEndpoint) {
        localStorage.removeItem('access_token');
        useAuthStore.getState().logout();
        window.dispatchEvent(new CustomEvent('session-expired'));
      }
    }
    return Promise.reject(err);
  }
);

export default api;
