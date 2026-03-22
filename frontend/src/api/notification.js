import { apiFetch } from "./_fetch"

const API = import.meta.env.VITE_API_URL

export const getMyNotifications = () =>
  apiFetch(`${API}/notification/me`, { credentials: "include" }).then(r => r.json())

export const markRead = (id) =>
  apiFetch(`${API}/notification/${id}/read`, { method: "PUT", credentials: "include" }).then(r => r.json())

export const markAllRead = () =>
  apiFetch(`${API}/notification/read-all`, { method: "PUT", credentials: "include" }).then(r => r.json())
