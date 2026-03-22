import { apiFetch } from "./_fetch"

const API = import.meta.env.VITE_API_URL

export const getAuditLogs = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return apiFetch(`${API}/audit${q ? "?" + q : ""}`, { credentials: "include" }).then(r => r.json())
}
