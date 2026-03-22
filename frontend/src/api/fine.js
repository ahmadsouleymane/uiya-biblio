import { apiFetch } from "./_fetch"

const API = import.meta.env.VITE_API_URL

export const getAllFines = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return apiFetch(`${API}/fine${q ? "?" + q : ""}`, { credentials: "include" }).then(r => r.json())
}

export const getUserFines = (userId) =>
  apiFetch(`${API}/fine/user/${userId}`, { credentials: "include" }).then(r => r.json())

export const payFine = (id) =>
  apiFetch(`${API}/fine/${id}/pay`, { method: "PUT", credentials: "include" }).then(r => r.json())

export const createManualFine = (data) =>
  apiFetch(`${API}/fine`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" }).then(r => r.json())

export const deleteFine = (id) =>
  apiFetch(`${API}/fine/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json())
