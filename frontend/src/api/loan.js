import { apiFetch } from "./_fetch"
const API = import.meta.env.VITE_API_URL + "/loan"
const opts = { credentials: "include", headers: { "Content-Type": "application/json" } }

export const borrowBook = (userId, bookId) =>
  apiFetch(`${API}/borrow`, { ...opts, method: "POST", body: JSON.stringify({ userId, bookId }) }).then(r => r.json())

export const returnBook = (loanId) =>
  apiFetch(`${API}/${loanId}/return`, { ...opts, method: "PUT" }).then(r => r.json())

export const getUserLoans = (userId) =>
  apiFetch(`${API}/user/${userId}`, { ...opts, method: "GET" }).then(r => r.json())

export const getAllLoans = () =>
  apiFetch(`${API}/`, { ...opts, method: "GET" }).then(r => r.json())

export const returnByUserAndIsbn = (userId, isbn) =>
  apiFetch(`${API}/return-by-scan`, { ...opts, method: "POST", body: JSON.stringify({ userId, isbn }) }).then(r => r.json())

export const renewLoan = (loanId) =>
  apiFetch(`${API}/${loanId}/renew`, { ...opts, method: "PUT" }).then(r => r.json())
