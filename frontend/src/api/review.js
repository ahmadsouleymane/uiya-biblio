import { apiFetch } from "./_fetch"

const API = import.meta.env.VITE_API_URL

export const upsertReview = (data) =>
  apiFetch(`${API}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json())

export const getBookReviews = (bookId) =>
  apiFetch(`${API}/review/book/${bookId}`, {  }).then(r => r.json())

export const deleteReview = (id) =>
  apiFetch(`${API}/review/${id}`, { method: "DELETE" }).then(r => r.json())
