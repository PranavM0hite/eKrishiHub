// src/api/axiosInstance.js
import axios from 'axios';
import { store } from '../app/store';
import { logout } from '../features/auth/authSlice';
import { toast } from 'react-toastify';

// Prefer Vite env; fallback to localhost
const baseURL = import.meta.env.VITE_API_BASE ;

// Endpoints that must NOT carry Authorization (public)
const NO_AUTH_PATHS = [
  '/farmer-login',
  '/customer-login',
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
];

const api = axios.create({
  baseURL,
  withCredentials: false, // set true only if your backend uses cookies
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Helper: get normalized pathname for a request
function getPathname(config) {
  try {
    // Handles relative config.url against baseURL
    const full = new URL(config.url || '', baseURL);
    return full.pathname; // e.g. /api/farmer-login or /farmer-login (depends on baseURL)
  } catch {
    // Fallback: just use the raw url
    return config.url || '';
  }
}

// Helper: check if a path starts with any of the NO_AUTH_PATHS entries
function isNoAuthPath(pathname) {
  // Ensure we check against both `/foo` and `/api/foo` forms
  return NO_AUTH_PATHS.some((p) => {
    return pathname.startsWith(p) || pathname.startsWith(`/api${p}`);
  });
}

// ---- Request interceptor ----
api.interceptors.request.use(
  (config) => {
    const pathname = getPathname(config);

    if (isNoAuthPath(pathname)) {
      // Ensure NO token goes with public endpoints
      if (config.headers) delete config.headers.Authorization;
    } else {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response interceptor ----
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const reqConfig = error?.config || {};
    const pathname = getPathname(reqConfig);

    // If it's a public auth endpoint (login/register), don't nuke session or redirect
    const isPublicAuth = isNoAuthPath(pathname);

    if ((status === 401 || status === 403) && !isPublicAuth) {
      // Session expired on a protected endpoint
      localStorage.removeItem('token');
      try { store.dispatch(logout()); } catch (_) {}
      toast.error('Session expired. Please log in again.');
      if (typeof window !== 'undefined') window.location.href = '/farmer-login';
    }

    // Optionally show a friendlier error for 500s (without breaking callers)
    if (status === 500 && !isPublicAuth) {
      toast.error('Server error. Please try again.');
    }

    return Promise.reject(error);
  }
);

export default api;
