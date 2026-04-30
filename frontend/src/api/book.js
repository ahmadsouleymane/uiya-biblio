import { apiFetch } from "./_fetch"
import { cacheSet, cacheGet } from "../utils/cache"
const API = import.meta.env.VITE_API_URL + "/book"
const opts = { headers: { "Content-Type": "application/json" } }

export const addBook = (data) =>
  apiFetch(`${API}/addBook`, { ...opts, method: "POST", body: JSON.stringify(data) }).then(r => r.json())

export const getBooks = (params = {}) => {
  // Mock data pour fonctionnement sans backend
  return Promise.resolve([
    {
      _id: "1",
      title: "L'Étranger",
      author: "Albert Camus",
      cover: "/src/assets/etranger.jpg",
      category: "Littérature Française",
      isbn: "9782070360024",
      description: "Un roman philosophique sur l'absurdité de l'existence"
    },
    {
      _id: "2", 
      title: "Le Petit Prince",
      author: "Antoine de Saint-Exupéry",
      cover: "/src/assets/rebelle.jpg",
      category: "Littérature Jeunesse",
      isbn: "9782070612710",
      description: "Une histoire poétique sur l'amitié et la vie"
    }
  ])
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
  Promise.resolve({
    totalBooks: 260,
    availableBooks: 180,
    borrowedBooks: 80,
    totalMembers: 600,
    newBooksThisMonth: 12
  })

export const getRecommendations = () =>
  Promise.resolve([
    {
      _id: "3",
      title: "1984",
      author: "George Orwell", 
      cover: "/src/assets/allah.jpeg",
      category: "Science-Fiction",
      isbn: "9780451524935",
      description: "Un roman dystopique sur la surveillance et le contrôle"
    }
  ])

export const generateBookDescription = (title, author) =>
  apiFetch(`${API}/generate-description`, { ...opts, method: "POST", body: JSON.stringify({ title, author }) }).then(r => r.json())

export const generateAllBookDescriptions = () =>
  apiFetch(`${API}/generate-all-descriptions`, { ...opts, method: "POST" }).then(r => r.json())

export const uploadBookPdf = (bookId, file) => {
  const formData = new FormData()
  formData.append("pdf", file)
  return apiFetch(`${API}/${bookId}/upload-pdf`, { method: "POST", body: formData }).then(r => r.json())
}

export const deleteBookPdf = (bookId) =>
  apiFetch(`${API}/${bookId}/pdf`, { method: "DELETE" }).then(r => r.json())

export const importBooksCsv = (file) => {
  const formData = new FormData()
  formData.append("file", file)
  return apiFetch(`${API}/import-csv`, { method: "POST", body: formData }).then(r => r.json())
}
