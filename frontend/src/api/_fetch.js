import toast from "react-hot-toast"

export function apiFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase()
  const isMutant = ["POST", "PUT", "DELETE", "PATCH"].includes(method)

  if (!navigator.onLine) {
    if (isMutant) toast.error("Action impossible hors ligne")
    return Promise.reject(new Error("offline"))
  }

  // Plus de temps pour les POST (upload d'images base64)
  const timeout = isMutant ? 30000 : 10000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer))
    .catch(err => {
      if (err.name === "AbortError" || err.message === "Failed to fetch") {
        if (isMutant) toast.error("Action impossible hors ligne")
        throw new Error("offline")
      }
      throw err
    })
}
