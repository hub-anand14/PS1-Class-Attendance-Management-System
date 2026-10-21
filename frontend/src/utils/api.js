const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ps1-class-attendance-management-system.onrender.com';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function calculateClassesNeeded(attended, total) {
  if (!total || total <= 0) return 0;
  const pct = (attended / total) * 100;
  if (pct >= 75) return 0;
  const raw = 3 * total - 4 * attended;
  return Math.max(0, Math.ceil(raw));
}
