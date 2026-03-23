import { apiFetch } from "./_fetch"

const API = import.meta.env.VITE_API_URL

export const getMyNotifications = () =>
  apiFetch(`${API}/notification/me`, {  }).then(r => r.json())

export const markRead = (id) =>
  apiFetch(`${API}/notification/${id}/read`, { method: "PUT" }).then(r => r.json())

export const markAllRead = () =>
  apiFetch(`${API}/notification/read-all`, { method: "PUT" }).then(r => r.json())
