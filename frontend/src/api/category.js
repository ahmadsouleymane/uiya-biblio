import { apiFetch } from "./_fetch"
const API = import.meta.env.VITE_API_URL + "/category"
const opts = { headers: { "Content-Type": "application/json" } }

export const getCategories = () =>
  apiFetch(API, { ...opts, method: "GET" }).then(r => r.json())

export const addCategory = (name) =>
  apiFetch(API, { ...opts, method: "POST", body: JSON.stringify({ name }) }).then(r => r.json())

export const updateCategory = (id, name) =>
  apiFetch(`${API}/${id}`, { ...opts, method: "PUT", body: JSON.stringify({ name }) }).then(r => r.json())

export const deleteCategory = (id) =>
  apiFetch(`${API}/${id}`, { ...opts, method: "DELETE" }).then(r => r.json())
