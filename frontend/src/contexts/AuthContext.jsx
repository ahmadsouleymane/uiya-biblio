import { createContext, useContext, useState, useEffect } from "react"
import { getMe } from "../api/user"
import { getToken, setToken } from "../api/_fetch"

export const UserContext = createContext()
export const useUser = () => useContext(UserContext)

const CACHE_KEY = "biblio_user"

function saveCache(u) {
  if (u) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(u))
    if (u.qrCode) {
      localStorage.setItem("biblio_qr", u.qrCode)
      localStorage.setItem("biblio_qr_name", u.fullName || "")
    }
  } else {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem("biblio_qr")
    localStorage.removeItem("biblio_qr_name")
    setToken(null)
  }
}

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) } catch { return null }
}

export default function UserProvider({ children }) {
  const cached = loadCache()
  const [user, setUserState] = useState(cached)
  const [loading, setLoading] = useState(!cached)

  const setUser = (u) => {
    setUserState(u)
    saveCache(u)
  }

  useEffect(() => {
    // Pas de token → pas de session → on garde le cache si offline
    if (!getToken()) {
      if (cached) setUser(null)
      setLoading(false)
      return
    }

    getMe()
      .then((data) => {
        if (data?._id) setUser(data)
        else if (!cached) setUser(null)
      })
      .catch(() => { /* offline ou timeout → on garde le cache */ })
      .finally(() => setLoading(false))
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  )
}
