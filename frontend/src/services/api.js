import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Emulador Android: 10.0.2.2 apunta al localhost de la PC.
// Dispositivo físico: usa la IP de la PC en la red local (ipconfig).
export const BASE_URL = 'http://10.10.10.231:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = await AsyncStorage.getItem('refresh');
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh });
          await AsyncStorage.setItem('access', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          await clearSession();
        }
      }
    }
    return Promise.reject(error);
  }
);

export async function saveSession({ access, refresh, user }) {
  await AsyncStorage.multiSet([
    ['access', access],
    ['refresh', refresh],
    ['user', JSON.stringify(user)],
  ]);
}

export async function getSession() {
  const [[, access], [, refresh], [, user]] = await AsyncStorage.multiGet([
    'access',
    'refresh',
    'user',
  ]);
  return { access, refresh, user: user ? JSON.parse(user) : null };
}

export async function clearSession() {
  await AsyncStorage.multiRemove(['access', 'refresh', 'user']);
}

// Expiración de sesión por inactividad: si la app pasa más tiempo
// que este umbral en segundo plano, el siguiente arranque pide login.
export const TIEMPO_SESION_MS = 5 * 60 * 1000;

const ACTIVIDAD_KEY = 'ultima_actividad';

export const marcarActividad = async () => {
  await AsyncStorage.setItem(ACTIVIDAD_KEY, String(Date.now())).catch(() => {});
};

export async function sesionExpirada() {
  const marca = await AsyncStorage.getItem(ACTIVIDAD_KEY);
  if (!marca) return true;
  return Date.now() - Number(marca) > TIEMPO_SESION_MS;
}

export const authService = {
  async login(username, password) {
    const { data } = await api.post('/auth/login/', { username, password });
    await saveSession(data);
    await marcarActividad();
    return data;
  },

  async register(payload) {
    const { data } = await api.post('/auth/register/', payload);
    return data;
  },

  async me() {
    const { data } = await api.get('/auth/me/');
    await AsyncStorage.setItem('user', JSON.stringify(data));
    return data;
  },

  async updatePerfil(payload) {
    const { data } = await api.patch('/auth/me/', payload);
    await AsyncStorage.setItem('user', JSON.stringify(data));
    return data;
  },

  async cambiarPassword(payload) {
    const { data } = await api.post('/auth/cambiar-password/', payload);
    return data;
  },

  async logout() {
    try {
      const refresh = await AsyncStorage.getItem('refresh');
      if (refresh) await api.post('/auth/logout/', { refresh });
    } catch {
      // el token pudo ya estar inválido; se limpia igual
    }
    await clearSession();
  },
};

export default api;
