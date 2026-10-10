const API_URL = import.meta.env.VITE_API_URL?.trim() || '';

export const apiRequest = async (path, options = {}) => {
  const headers = new Headers(options.headers || {});
  const token = sessionStorage.getItem('welfare_token');
  const isFormData = options.body instanceof FormData;

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error(`เชื่อมต่อ Backend ไม่ได้ (${API_URL || 'Vite proxy'})`);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.message || `Request failed (${response.status})`);
  }
  return payload;
};

export const apiBaseUrl = API_URL;
