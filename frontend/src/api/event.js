import { apiFetch } from "./_fetch"
import { cacheSet, cacheGet } from "../utils/cache"
const API = import.meta.env.VITE_API_URL + "/event"

export const getEvents = () => {
  // Mock data pour fonctionnement sans backend
  return Promise.resolve([
    {
      _id: "1",
      title: "Club de Lecture",
      description: "Discutons des grands classiques de la littérature française",
      date: "2026-05-15T18:00:00Z",
      location: "Salle principale",
      poster: "/src/assets/books-shelf.jpg"
    },
    {
      _id: "2", 
      title: "Atelier d'écriture",
      description: "Apprenez les techniques de base de l'écriture créative",
      date: "2026-05-20T14:00:00Z",
      location: "Salle B",
      poster: "/src/assets/library-candle.jpg"
    }
  ])
}

export const addEvent = (formData) =>
  apiFetch(`${API}/`, { method: "POST", body: formData }).then(r => r.json())

export const deleteEvent = (id) =>
  apiFetch(`${API}/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" } }).then(r => r.json())

export const registerForEvent = (id) =>
  Promise.resolve({ message: "Inscription réussie", count: Math.floor(Math.random() * 20) + 5 })

export const unregisterFromEvent = (id) =>
  Promise.resolve({ message: "Désinscription effectuée", count: Math.floor(Math.random() * 20) + 5 })

export const getRegistrations = (id) =>
  apiFetch(`${API}/${id}/registrations`, {  }).then(r => r.json())
