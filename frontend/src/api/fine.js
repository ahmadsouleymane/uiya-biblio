import { apiFetch } from "./_fetch"

const API = import.meta.env.VITE_API_URL

export const getAllFines = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return apiFetch(`${API}/fine${q ? "?" + q : ""}`, {  }).then(r => r.json())
}

export const getUserFines = (userId) =>
  apiFetch(`${API}/fine/user/${userId}`, {  }).then(r => r.json())

export const payFine = (id) =>
  apiFetch(`${API}/fine/${id}/pay`, { method: "PUT" }).then(r => r.json())

export const createManualFine = (data) =>
  apiFetch(`${API}/fine`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json())

export const deleteFine = (id) =>
  apiFetch(`${API}/fine/${id}`, { method: "DELETE" }).then(r => r.json())
