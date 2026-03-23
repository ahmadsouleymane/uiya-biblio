import { WifiOff, Wifi } from "lucide-react"
import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import useOnline from "../hooks/useOnline"

const NO_BOTTOM_NAV = ["/connexion", "/inscription", "/mot-de-passe-oublie"]

export default function OfflineBanner() {
  const online = useOnline()
  const { pathname } = useLocation()
  const [show, setShow]         = useState(false)
  const [justBack, setJustBack] = useState(false)
  const hasBottomNav = !NO_BOTTOM_NAV.includes(pathname)

  useEffect(() => {
    if (!online) {
      setShow(true)
      setJustBack(false)
    } else {
      if (show) {
        // vient de se reconnecter → flash vert puis disparaît
        setJustBack(true)
        const t = setTimeout(() => { setShow(false); setJustBack(false) }, 2500)
        return () => clearTimeout(t)
      }
    }
  }, [online])

  if (!show) return null

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold transition-all"
      style={{
        background: justBack ? "#059669" : "#1e293b",
        color: "#fff",
        whiteSpace: "nowrap",
        bottom: hasBottomNav
          ? "calc(64px + env(safe-area-inset-bottom) + 12px)"
          : "calc(env(safe-area-inset-bottom) + 12px)",
      }}
    >
      {justBack
        ? <><Wifi className="w-4 h-4" /> Connexion rétablie</>
        : <><WifiOff className="w-4 h-4" /> Hors ligne — actions désactivées</>
      }
    </div>
  )
}
