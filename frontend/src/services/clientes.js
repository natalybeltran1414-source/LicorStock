import api from './api';

export const clientesService = {
  list: (params = {}) => api.get('/clientes/', { params }),
  get: id => api.get(`/clientes/${id}/`),
  create: data => api.post('/clientes/', data),
  update: (id, data) => api.patch(`/clientes/${id}/`, data),
  remove: id => api.delete(`/clientes/${id}/`),
  toggleEstado: id => api.post(`/clientes/${id}/toggle_estado/`),
};
