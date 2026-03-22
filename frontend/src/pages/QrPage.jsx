import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, WifiOff } from "lucide-react"
import logoUrl from "../assets/logo.svg"

export default function QrPage() {
  const navigate = useNavigate()
  const [qr, setQr] = useState(null)
  const [name, setName] = useState("")
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    setQr(localStorage.getItem("biblio_qr"))
    setName(localStorage.getItem("biblio_qr_name") || "")
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener("online", on)
    window.addEventListener("offline", off)
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off) }
  }, [])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #040848 0%, #0e1a7a 100%)" }}
    >
      {/* Hors ligne indicator */}
      {!online && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold z-50"
          style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}
        >
          <WifiOff className="w-3.5 h-3.5" /> Mode hors ligne
        </div>
      )}

      {/* Retour */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-5 left-5 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
        style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {qr ? (
        <div className="flex flex-col items-center gap-6 w-full max-w-xs">
          {/* Logo */}
          <img src={logoUrl} alt="UIYA" className="h-8 opacity-70" />

          {/* QR en grand */}
          <div
            className="p-5 rounded-3xl shadow-2xl"
            style={{ background: "#ffffff" }}
          >
            <img src={qr} alt="QR Code" className="w-64 h-64 block" />
          </div>

          {/* Nom */}
          <div className="text-center">
            <p className="text-white font-black text-xl leading-tight">{name}</p>
            <p className="text-white/40 text-sm mt-1">Bibliothèque UIYA</p>
          </div>

          <p className="text-white/25 text-xs text-center leading-relaxed px-4">
            Présente ce QR code à la bibliothèque pour emprunter un livre ou accéder à la salle de lecture
          </p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-white/60 font-semibold text-sm">Aucun QR code disponible</p>
          <p className="text-white/30 text-xs mt-2">Connecte-toi d'abord en ligne pour activer l'accès hors ligne</p>
          <button
            onClick={() => navigate("/connexion")}
            className="mt-5 px-6 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: "#A71E3C" }}
          >
            Se connecter
          </button>
        </div>
      )}
    </div>
  )
}
