declare global { interface Window { __API_BASE_URL__?: string } }
export const API_BASE_URL =
  window.__API_BASE_URL__ || 'http://localhost:3000';