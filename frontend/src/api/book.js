import { apiFetch } from "./_fetch"
import { cacheSet, cacheGet } from "../utils/cache"
const API = import.meta.env.VITE_API_URL + "/book"
const opts = { headers: { "Content-Type": "application/json" } }

export const addBook = (data) =>
  apiFetch(`${API}/addBook`, { ...opts, method: "POST", body: JSON.stringify(data) }).then(r => r.json())

export const getBooks = (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const cacheKey = "biblio_books_" + (query || "all")
  return apiFetch(`${API}/${query ? "?" + query : ""}`, { ...opts, method: "GET" })
    .then(r => r.json())
    .then(data => { cacheSet(cacheKey, data); return data })
}

export const getBookById = (id) => {
  const cacheKey = "biblio_book_" + id
  return apiFetch(`${API}/${id}`, { ...opts, method: "GET" })
    .then(r => r.json())
    .then(data => { cacheSet(cacheKey, data); return data })
}

export const getBookByIsbn = (isbn) =>
  apiFetch(`${API}/isbn/${isbn}`, { ...opts, method: "GET" }).then(r => r.json())

export const updateBook = (id, data) =>
  apiFetch(`${API}/${id}`, { ...opts, method: "PUT", body: JSON.stringify(data) }).then(r => r.json())

export const deleteBook = (id) =>
  apiFetch(`${API}/${id}`, { ...opts, method: "DELETE" }).then(r => r.json())

export const getBookStats = () =>
  apiFetch(`${API}/stats`, { ...opts, method: "GET" }).then(r => r.json())

export const getRecommendations = () =>
  apiFetch(`${API}/recommendations`, { ...opts, method: "GET" }).then(r => r.json())

export const generateBookDescription = (title, author) =>
  apiFetch(`${API}/generate-description`, { ...opts, method: "POST", body: JSON.stringify({ title, author }) }).then(r => r.json())

export const generateAllBookDescriptions = () =>
  apiFetch(`${API}/generate-all-descriptions`, { ...opts, method: "POST" }).then(r => r.json())

export const importBooksCsv = (file) => {
  const formData = new FormData()
  formData.append("file", file)
  return apiFetch(`${API}/import-csv`, { method: "POST", body: formData }).then(r => r.json())
}
