import { apiFetch } from "./_fetch"

const API = import.meta.env.VITE_API_URL

export const getSettings = () =>
  apiFetch(`${API}/settings`, { credentials: "include" }).then(r => r.json())

export const updateSettings = (data) =>
  apiFetch(`${API}/settings`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" }).then(r => r.json())
