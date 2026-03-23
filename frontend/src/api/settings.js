import { apiFetch } from "./_fetch"

const API = import.meta.env.VITE_API_URL

export const getSettings = () =>
  apiFetch(`${API}/settings`, {  }).then(r => r.json())

export const updateSettings = (data) =>
  apiFetch(`${API}/settings`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json())
