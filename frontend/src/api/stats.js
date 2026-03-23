import { apiFetch } from "./_fetch"

const API = import.meta.env.VITE_API_URL + "/stats"
const opts = { headers: { "Content-Type": "application/json" } }

export const getAdminStats = () =>
  fetch(`${API}/`, { ...opts, method: "GET" }).then(r => r.json())

export const exportPdf = (params) => {
  const query = new URLSearchParams(params).toString()
  return apiFetch(`${API}/export-pdf?${query}`, { method: "GET" })
}
