import { apiFetch } from "./_fetch"

const API = import.meta.env.VITE_API_URL

export const getSettings = () =>
  Promise.resolve({
    featuredBook: {
      _id: "1",
      title: "L'Étranger",
      author: "Albert Camus",
      cover: "/src/assets/etranger.jpg",
      category: "Littérature Française",
      isbn: "9782070360024",
      description: "Un roman philosophique sur l'absurdité de l'existence"
    }
  })

export const updateSettings = (data) =>
  apiFetch(`${API}/settings`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json())
