// =============================================================================
// API CLIENT - FRONTEND
// =============================================================================
// Cliente HTTP para conectar con el backend
// 
// Con Clerk: cada request incluye automáticamente el session token
// en el header Authorization: Bearer <token>

import axios from 'axios';

// Base URL del backend
let RAW_BASE_URL = import.meta.env.VITE_API_URL || '';

// Si no hay URL definida (Vite), usamos el origen actual (para el proxy)
// Si hay URL y termina en /api, lo normalizamos quitando el path
// para que el interceptor sea el único encargado de agregar /api
let FINAL_BASE_URL = RAW_BASE_URL;
if (FINAL_BASE_URL.endsWith('/api')) {
  FINAL_BASE_URL = FINAL_BASE_URL.slice(0, -4);
} else if (FINAL_BASE_URL.endsWith('/api/')) {
  FINAL_BASE_URL = FINAL_BASE_URL.slice(0, -5);
}

// Fallback para desarrollo local si no hay proxy ni env
if (!FINAL_BASE_URL && import.meta.env.DEV) {
  // Usar proxy de Vite (deja vacío para que el proxy funcione)
  FINAL_BASE_URL = ''; 
}

export const apiClient = axios.create({
  baseURL: FINAL_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// =============================================================================
// REQUEST INTERCEPTOR — Prefijo /api + Clerk session token
// =============================================================================
let getTokenFn: (() => Promise<string | null>) | null = null;

export const setAuthTokenGetter = (fn: () => Promise<string | null>) => {
  getTokenFn = fn;
};

apiClient.interceptors.request.use(
  async (config) => {
    // 1. Agregar prefijo /api a las URLs solo si es necesario
    if (config.url) {
      const hasPrefixInUrl = config.url.startsWith('/api/') || config.url === '/api';
      const hasPrefixInBase = config.baseURL?.endsWith('/api') || config.baseURL?.endsWith('/api/');
      
      if (!hasPrefixInUrl && !hasPrefixInBase) {
        if (config.url.startsWith('/')) {
          config.url = '/api' + config.url;
        } else {
          config.url = '/api/' + config.url;
        }
      }
    }

    // 2. Inyectar Clerk session token
    try {
      if (getTokenFn) {
        const token = await getTokenFn();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // Si no hay sesión, el backend responderá 401
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =============================================================================
// RESPONSE INTERCEPTOR — Manejo de errores con mensajes limpios
// =============================================================================
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'Error de conexión';
    
    if (error.response) {
      message = error.response.data?.message || error.response.data?.error || `Error del servidor (${error.response.status})`;
    } else if (error.request) {
      message = 'No se puede conectar al servidor. Verifique que el backend esté corriendo.';
    } else {
      message = error.message || 'Error de conexión';
    }
    
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export default apiClient;
