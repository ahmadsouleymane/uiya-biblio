import toast from "react-hot-toast"

const TIMEOUT_MS = 8000 // 8 secondes max avant d'abandonner

export function apiFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase()
  const isMutant = ["POST", "PUT", "DELETE", "PATCH"].includes(method)

  if (!navigator.onLine) {
    if (isMutant) toast.error("Action impossible hors ligne")
    return Promise.reject(new Error("offline"))
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer))
    .then(res => {
      if (res.status === 401) {
        localStorage.removeItem("biblio_user")
        toast.error("Session expirée, veuillez vous reconnecter")
        window.location.href = "/connexion"
        throw new Error("non_authentifie")
      }
      return res
    })
    .catch(err => {
      if (err.message === "non_authentifie") throw err
      if (err.name === "AbortError" || err.message === "Failed to fetch") {
        if (isMutant) toast.error("Action impossible hors ligne")
        throw new Error("offline")
      }
      throw err
    })
}
