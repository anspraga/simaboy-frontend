import { useAuthStore } from '../store/authStore';

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = useAuthStore.getState().token;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
};
