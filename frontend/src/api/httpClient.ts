import axios, {AxiosError} from 'axios'
import { API_BASE_URL } from '../config.js';
import { router } from '../main.js';

const httpCall = axios.create({
	baseURL: `${API_BASE_URL}/api`,
	withCredentials: true,
	headers: { 'Content-Type': 'application/json' }
});

httpCall.interceptors.response.use(
  resp => resp,
  err => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      setTimeout(() => router.navigateTo('/'), 0);
      return Promise.resolve({
        data: '<div class="flex …">Redirecting…</div>',
      });
    }
    return Promise.reject(err);
  }
);

export default httpCall;