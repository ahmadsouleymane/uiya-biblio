import { apiFetch, setToken, getToken } from "./_fetch"
const API = import.meta.env.VITE_API_URL + "/user"
const opts = { headers: { "Content-Type": "application/json" } }

export const addUser = (data) => {
  // Mock signup pour fonctionnement sans backend
  const mockUser = {
    _id: "user-" + Date.now(),
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    department: data.department,
    year: data.year,
    role: "student",
    token: "mock-user-token-" + Date.now()
  }
  setToken(mockUser.token)
  return Promise.resolve(mockUser)
}

export const login = (phone, password) => {
  // Mock login pour fonctionnement sans backend
  if (phone === "admin" && password === "admin") {
    const mockUser = {
      token: "mock-admin-token",
      user: {
        _id: "admin-1",
        fullName: "Admin Bibliothèque",
        phone: "admin",
        role: "admin",
        email: "admin@biblio.ui"
      }
    }
    setToken(mockUser.token)
    return Promise.resolve(mockUser)
  }
  if (phone === "user" && password === "user") {
    const mockUser = {
      token: "mock-user-token",
      user: {
        _id: "user-1",
        fullName: "Étudiant Demo",
        phone: "user",
        role: "student",
        email: "user@biblio.ui"
      }
    }
    setToken(mockUser.token)
    return Promise.resolve(mockUser)
  }
  return Promise.reject(new Error("Identifiants incorrects"))
}

export const logout = () => {
  setToken(null)
  return Promise.resolve({ message: "Déconnecté" })
}

export const getMe = () => {
  const token = getToken()
  if (!token) return Promise.reject(new Error("No token"))
  
  // Retourner l'utilisateur mock selon le token
  if (token === "mock-admin-token") {
    return Promise.resolve({
      _id: "admin-1",
      fullName: "Admin Bibliothèque",
      phone: "admin",
      role: "admin",
      email: "admin@biblio.ui"
    })
  }
  if (token === "mock-user-token") {
    return Promise.resolve({
      _id: "user-1",
      fullName: "Étudiant Demo",
      phone: "user",
      role: "student",
      email: "user@biblio.ui"
    })
  }
  return Promise.reject(new Error("Token invalide"))
}

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
