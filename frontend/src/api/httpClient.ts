import axios, { AxiosError, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../config.js';
import { router } from '../main.js';

const httpCall = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

function handleUnauthorized() {
  console.warn('Session expired, redirecting to landing page');
  localStorage.removeItem('userId');
  // Broadcast to other tabs and local app state.
  localStorage.setItem('session-cleared', Date.now().toString());
  // Notify the app so stores can be cleared without circular imports.
  window.dispatchEvent(new Event('session:unauthorized'));
  setTimeout(() => router.navigateTo('/'), 0);
}

httpCall.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      handleUnauthorized();

      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default httpCall;
