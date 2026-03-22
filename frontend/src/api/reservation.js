import { apiFetch } from "./_fetch"

const API = import.meta.env.VITE_API_URL

export const createReservation = (bookId) =>
  apiFetch(`${API}/reservation`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookId }), credentials: "include" }).then(r => r.json())

export const cancelReservation = (id) =>
  apiFetch(`${API}/reservation/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json())

export const getMyReservations = () =>
  apiFetch(`${API}/reservation/me`, { credentials: "include" }).then(r => r.json())

export const getBookQueue = (bookId) =>
  apiFetch(`${API}/reservation/book/${bookId}`, { credentials: "include" }).then(r => r.json())

export const getAllReservations = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return apiFetch(`${API}/reservation${q ? "?" + q : ""}`, { credentials: "include" }).then(r => r.json())
}
