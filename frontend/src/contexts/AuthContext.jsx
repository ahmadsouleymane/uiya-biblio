import { createContext, useContext, useState, useEffect } from "react"
import { getMe } from "../api/user"

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
  }
}

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) } catch { return null }
}

export default function UserProvider({ children }) {
  const cached = loadCache()
  const [user, setUserState] = useState(cached)
  // Si on a un cache, on ne bloque pas le rendu — on rafraîchit en arrière-plan
  const [loading, setLoading] = useState(!cached)

  const setUser = (u) => {
    setUserState(u)
    saveCache(u)
  }

  useEffect(() => {
    getMe()
      .then((data) => {
        if (data?._id) setUser(data)
        else setUser(null) // session expirée côté serveur
      })
      .catch(() => { /* offline ou timeout → on garde le cache, on ne touche pas à user */ })
      .finally(() => setLoading(false))
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  )
}
