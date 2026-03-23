import toast from "react-hot-toast"

const TOKEN_KEY = "biblio_token"

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function apiFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase()
  const isMutant = ["POST", "PUT", "DELETE", "PATCH"].includes(method)

  if (!navigator.onLine) {
    if (isMutant) toast.error("Action impossible hors ligne")
    return Promise.reject(new Error("offline"))
  }

  // Injecter le token dans les headers
  const token = getToken()
  const headers = { ...(options.headers || {}) }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const timeout = isMutant ? 30000 : 10000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  return fetch(url, { ...options, headers, signal: controller.signal })
    .finally(() => clearTimeout(timer))
    .catch(err => {
      if (err.name === "AbortError" || err.message === "Failed to fetch") {
        if (isMutant) toast.error("Action impossible hors ligne")
        throw new Error("offline")
      }
      throw err
    })
}
