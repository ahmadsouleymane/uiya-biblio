import { apiFetch } from "./_fetch"
const API = import.meta.env.VITE_API_URL + "/presence"
const opts = { credentials: "include", headers: { "Content-Type": "application/json" } }

export const checkIn = (userId) =>
  apiFetch(`${API}/checkin`, { ...opts, method: "POST", body: JSON.stringify({ userId }) }).then(r => r.json())

export const checkOut = (presenceId) =>
  apiFetch(`${API}/${presenceId}/checkout`, { ...opts, method: "PUT" }).then(r => r.json())

export const getTodayPresence = () =>
  apiFetch(`${API}/today`, { ...opts, method: "GET" }).then(r => r.json())

export const getPresenceHistory = (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return apiFetch(`${API}/history${query ? "?" + query : ""}`, { ...opts, method: "GET" }).then(r => r.json())
}
