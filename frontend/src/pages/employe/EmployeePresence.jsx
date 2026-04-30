import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader } from "@zxing/library"
import { CheckCircle, Users, XCircle, Camera } from "lucide-react"
import Navbar from "../../components/navbar"
import Footer from "../../components/footer"
import { checkIn, checkOut, getTodayPresence } from "../../api/presence"
import toast from "react-hot-toast"

export default function EmployeePresence() {
  const videoRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [lastCheckin, setLastCheckin] = useState(null)
  const [presences, setPresences] = useState([])
  const [loading, setLoading] = useState(true)

  const loadPresences = () =>
    getTodayPresence().then(p => setPresences(Array.isArray(p) ? p : []))

  useEffect(() => {
    loadPresences().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!scanning) return
    const codeReader = new BrowserMultiFormatReader()
    let active = true

    codeReader.listVideoInputDevices().then(devices => {
      const back = devices.find(d => /back|rear|environment/i.test(d.label))
      const deviceId = back?.deviceId || null
      return codeReader.decodeFromVideoDevice(deviceId, videoRef.current, async (result) => {
        if (result && active) {
          active = false
          codeReader.reset()
          setScanning(false)
          new Audio("/done.mp3").play().catch(() => {})

          const userId = result.getText()
          if (!/^[a-f0-9]{24}$/i.test(userId)) {
            toast.error("QR code invalide")
            return
          }
          try {
            const data = await checkIn(userId)
            if (data._id) {
              setLastCheckin(data)
              toast.success(`${data.user?.fullName} enregistré !`)
              loadPresences()
            } else {
              toast.error(data.message || "Erreur lors du check-in")
            }
          } catch {
            toast.error("Erreur serveur")
          }
        }
      })
    }).catch(() => {
      toast.error("Impossible d'accéder à la caméra")
      setScanning(false)
    })

    return () => { active = false; codeReader.reset() }
  }, [scanning])

  const handleCheckOut = async (presenceId) => {
    try {
      const data = await checkOut(presenceId)
      if (data._id) { toast.success("Sortie enregistrée"); loadPresences() }
      else toast.error(data.message || "Erreur")
    } catch {
      toast.error("Erreur serveur")
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <Navbar />

      <div className="w-full px-4 py-8">
        <div className="mb-6">
          <p className="overline mb-1">Employé</p>
          <h1 className="text-xl md:text-3xl font-black text-primary">Gestion des présences</h1>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-6 lg:space-y-0">
          {/* Colonne gauche : Scanner + dernière entrée */}
          <div className="space-y-6">
            {/* Scanner card */}
            <div className="card-p space-y-4">
              <div className="flex items-center gap-3">
                <div className="stat-icon" style={{ background: "rgba(4,8,72,0.07)", marginBottom: 0 }}>
                  <Camera className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-black text-primary">Scanner le QR Code</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Pointe la caméra vers le QR du lecteur</p>
                </div>
              </div>

              {scanning ? (
                <div className="space-y-3">
                  <video ref={videoRef} className="w-full h-56 object-cover rounded-xl bg-black" />
                  <button onClick={() => setScanning(false)} className="btn btn-ghost w-full">
                    Annuler
                  </button>
                </div>
              ) : (
                <button onClick={() => setScanning(true)} className="btn btn-primary btn-lg w-full">
                  <Camera className="w-5 h-5" /> Démarrer le scan
                </button>
              )}
            </div>

            {/* Dernière entrée */}
            {lastCheckin && (
              <div className="flex items-center gap-4 p-5 rounded-2xl fade-in-up" style={{ background: "#ecfdf5", border: "1px solid #bbf7d0" }}>
                <CheckCircle className="w-9 h-9 shrink-0" style={{ color: "#059669" }} />
                <div>
                  <p className="font-black text-lg" style={{ color: "#065f46" }}>{lastCheckin.user?.fullName}</p>
                  <p className="text-sm capitalize" style={{ color: "#059669" }}>{lastCheckin.user?.role} · {lastCheckin.user?.department}</p>
                  <p className="text-xs mt-1" style={{ color: "#6ee7b7" }}>
                    Entrée à {new Date(lastCheckin.checkIn).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Colonne droite : Liste du jour */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-secondary" />
                <p className="font-black text-primary">Présences aujourd'hui</p>
              </div>
              <span className="badge badge-primary">{presences.length}</span>
            </div>

            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-16" />)}</div>
            ) : presences.length === 0 ? (
              <div className="empty-state">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Aucune présence aujourd'hui</p>
              </div>
            ) : (
              <div className="row-list">
                {presences.map(p => (
                  <div key={p._id} className="row-item">
                    <div className="avatar avatar-md">
                      {(p.user?.fullName || "?").split(" ").map(n => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-primary">{p.user?.fullName}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        Entrée {new Date(p.checkIn).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        {p.checkOut && ` · Sortie ${new Date(p.checkOut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
                      </p>
                      {p.scannedBy && (
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          Par : <span className="font-medium">{p.scannedBy.fullName}</span>
                        </p>
                      )}
                    </div>
                    {p.checkOut ? (
                      <span className="badge badge-gray">Sorti</span>
                    ) : (
                      <button
                        onClick={() => handleCheckOut(p._id)}
                        className="btn btn-sm btn-secondary flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Faire sortir
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}