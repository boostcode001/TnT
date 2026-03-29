import api from './client';

export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),

  register: (username, password) =>
    api.post('/auth/register', { username, password }),

  logout: () => Promise.resolve(),   // 백엔드 logout 엔드포인트 없음

  me: () =>
    api.get('/auth/me'),

  withdraw: () =>
    api.delete('/auth/withdraw'),
};
