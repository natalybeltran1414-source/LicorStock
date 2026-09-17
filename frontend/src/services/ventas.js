import api from './api';

export const ventasService = {
  list: (params = {}) => api.get('/ventas/', { params }),
  get: id => api.get(`/ventas/${id}/`),
  create: data => api.post('/ventas/', data),
  anular: id => api.post(`/ventas/${id}/anular/`),
  resumen: () => api.get('/ventas/resumen/'),
  semanal: () => api.get('/ventas/semanal/'),
  topProductos: (params = {}) => api.get('/ventas/top_productos/', { params }),
};

export const deudasService = {
  list: (params = {}) => api.get('/deudas/', { params }),
  abonar: (id, data) => api.post(`/deudas/${id}/abonar/`, data),
  resumen: () => api.get('/deudas/resumen/'),
};
