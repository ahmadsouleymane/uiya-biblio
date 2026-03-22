import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext(null)

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("biblio_theme") || "light")

  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("biblio_theme", theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => (t === "dark" ? "light" : "dark"))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext)
}
