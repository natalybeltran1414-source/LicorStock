import api from './api';

export const productosService = {
  list: (params = {}) => api.get('/productos/', { params }),
  get: id => api.get(`/productos/${id}/`),
  create: data => api.post('/productos/', data),
  update: (id, data) => api.patch(`/productos/${id}/`, data),
  remove: id => api.delete(`/productos/${id}/`),
  bajoStock: () => api.get('/productos/bajo_stock/'),
  resumen: () => api.get('/productos/resumen/'),
  subirImagen: (id, uri) => {
    const fd = new FormData();
    fd.append('imagen', { uri, name: `p${id}_${Date.now()}.jpg`, type: 'image/jpeg' });
    return api.post(`/productos/${id}/imagen/`, fd);
  },
  quitarImagen: id => api.delete(`/productos/${id}/imagen/`),
};

export const categoriasService = {
  list: () => api.get('/categorias/'),
  create: data => api.post('/categorias/', data),
  update: (id, data) => api.patch(`/categorias/${id}/`, data),
  remove: id => api.delete(`/categorias/${id}/`),
};

export const movimientosService = {
  list: (params = {}) => api.get('/movimientos/', { params }),
  ajustar: data => api.post('/movimientos/ajustar/', data),
};
