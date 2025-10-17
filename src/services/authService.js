const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_ORIGIN || (import.meta.env.DEV ? 'http://localhost:4000' : '');
const AUTH_KEY = "auth_token";
const AUTH_USER = "auth_user";
const AUTH_EXPIRES = "auth_expires";

// 3 horas en milisegundos
const SESSION_MS = 3 * 60 * 60 * 1000;

export async function login(email, senha) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Login failed");
  // Guarda token y user minimal en localStorage si vienen
  if (data.token) localStorage.setItem(AUTH_KEY, data.token);
  if (data.user) localStorage.setItem(AUTH_USER, JSON.stringify(data.user));
  // Guardar expiración: ahora + SESSION_MS
  const expiresAt = Date.now() + SESSION_MS;
  localStorage.setItem(AUTH_EXPIRES, String(expiresAt));
  return data;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_USER);
  localStorage.removeItem(AUTH_EXPIRES);
}

export function getCurrentUser() {
  try {
    if (!isAuthenticated()) return null;
    return JSON.parse(localStorage.getItem(AUTH_USER) || "null");
  } catch (e) {
    return null;
  }
}

export function getToken() {
  if (!isAuthenticated()) return null;
  return localStorage.getItem(AUTH_KEY);
}

export function isAuthenticated() {
  const token = localStorage.getItem(AUTH_KEY);
  const expires = Number(localStorage.getItem(AUTH_EXPIRES) || "0");
  if (!token) return false;
  if (!expires || Date.now() > expires) {
    // limpiar almacenamiento si venció
    logout();
    return false;
  }
  return true;
}

export function getSessionRemainingMs() {
  const expires = Number(localStorage.getItem(AUTH_EXPIRES) || "0");
  return Math.max(0, expires - Date.now());
}
