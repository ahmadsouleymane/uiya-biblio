import { apiFetch, setToken, getToken } from "./_fetch"
const API = import.meta.env.VITE_API_URL?.replace(/\/$/, '') + "/user"
const opts = { headers: { "Content-Type": "application/json" } }

export const addUser = (data) =>
  apiFetch(`${API}/addUser`, { ...opts, method: "POST", body: JSON.stringify(data) })
    .then(r => r.json())
    .then(data => { if (data.token) setToken(data.token); return data })

export const login = (phone, password) =>
  apiFetch(`${API}/login`, { ...opts, method: "POST", body: JSON.stringify({ phone, password }) })
    .then(r => r.json())
    .then(data => { if (data.token) setToken(data.token); return data })

export const logout = () =>
  apiFetch(`${API}/logout`, { ...opts, method: "POST" })
    .then(r => r.json())
    .then(data => { setToken(null); return data })

export const getMe = () =>
  apiFetch(`${API}/me`, { ...opts, method: "GET" }).then(r => r.json())

export const updateMe = (data) =>
  apiFetch(`${API}/me`, { ...opts, method: "PUT", body: JSON.stringify(data) }).then(r => r.json())

export const getUserById = (id) =>
  apiFetch(`${API}/by-id/${id}`, { ...opts, method: "GET" }).then(r => r.json())

export const getAllUsers = () =>
  apiFetch(`${API}/`, { ...opts, method: "GET" }).then(r => r.json())

export const updateUserRole = (id, role) =>
  apiFetch(`${API}/${id}/role`, { ...opts, method: "PUT", body: JSON.stringify({ role }) }).then(r => r.json())

export const deleteUser = (id) =>
  apiFetch(`${API}/${id}`, { ...opts, method: "DELETE" }).then(r => r.json())

export const forgotPassword = (email) =>
  apiFetch(`${API}/forgot-password`, { ...opts, method: "POST", body: JSON.stringify({ email }) }).then(r => r.json())

export const resetPassword = (token, password) =>
  apiFetch(`${API}/reset-password/${token}`, { ...opts, method: "POST", body: JSON.stringify({ password }) }).then(r => r.json())

export const addFavorite = (bookId) =>
  apiFetch(`${API}/favorites/${bookId}`, { ...opts, method: "POST" }).then(r => r.json())

export const removeFavorite = (bookId) =>
  apiFetch(`${API}/favorites/${bookId}`, { ...opts, method: "DELETE" }).then(r => r.json())

export const getFavorites = () =>
  apiFetch(`${API}/favorites`, { ...opts, method: "GET" }).then(r => r.json())

export const getUserStats = (userId) =>
  apiFetch(`${API}/stats/${userId}`, { ...opts, method: "GET" }).then(r => r.json())

export const importUsersCsv = (file) => {
  const formData = new FormData()
  formData.append("file", file)
  return apiFetch(`${API}/import-csv`, { method: "POST", body: formData }).then(r => r.json())
}
