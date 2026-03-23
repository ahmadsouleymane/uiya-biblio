import { apiFetch } from "./_fetch"
import { cacheSet, cacheGet } from "../utils/cache"
const API = import.meta.env.VITE_API_URL + "/event"

export const getEvents = () => {
  if (!navigator.onLine) {
    const cached = cacheGet("biblio_events")
    if (cached) return Promise.resolve(cached)
    return Promise.reject(new Error("offline"))
  }
  return apiFetch(`${API}/`, {  })
    .then(r => r.json())
    .then(data => { cacheSet("biblio_events", data); return data })
}

export const addEvent = (formData) =>
  apiFetch(`${API}/`, { method: "POST", body: formData }).then(r => r.json())

export const deleteEvent = (id) =>
  apiFetch(`${API}/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" } }).then(r => r.json())

export const registerForEvent = (id) =>
  apiFetch(`${API}/${id}/register`, { method: "POST" }).then(r => r.json())

export const unregisterFromEvent = (id) =>
  apiFetch(`${API}/${id}/register`, { method: "DELETE" }).then(r => r.json())

export const getRegistrations = (id) =>
  apiFetch(`${API}/${id}/registrations`, {  }).then(r => r.json())
