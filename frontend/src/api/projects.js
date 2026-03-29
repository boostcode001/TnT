import api from './client';

export const projectsAPI = {
  getAll: () =>
    api.get('/projects'),

  getById: (id) =>
    api.get(`/projects/${id}`),

  create: (formData) =>
    api.post('/projects', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteProject: (id) =>
    api.delete(`/projects/${id}`),
};
