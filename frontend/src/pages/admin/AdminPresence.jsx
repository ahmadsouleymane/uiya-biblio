import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader } from "@zxing/library"
import { Users, ChevronLeft, ChevronRight, Camera, CheckCircle, XCircle } from "lucide-react"
import Navbar from "../../components/navbar"
import Footer from "../../components/footer"
import { checkIn, checkOut, getTodayPresence, getPresenceHistory } from "../../api/presence"
import toast from "react-hot-toast"

const roleConfig = {
  student:  { label: "Étudiant", cls: "badge-blue" },
  employee: { label: "Employé",  cls: "badge-purple" },
  admin:    { label: "Admin",    cls: "badge-red" },
}

function fmt(date) {
  if (!date) return null
  return new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

const PAGE_SIZE = 30

export default function AdminPresence() {
  const videoRef = useRef(null)
  const [view, setView]           = useState("today")
  const [scanning, setScanning]   = useState(false)
  const [lastCheckin, setLastCheckin] = useState(null)

  const [presences, setPresences] = useState([])
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const loadToday = () =>
    getTodayPresence().then(p => { setPresences(Array.isArray(p) ? p : []); setTotalPages(1) })

  useEffect(() => {
    setLoading(true)
    setPage(1)
    if (view === "today") {
      loadToday().finally(() => setLoading(false))
    } else {
      getPresenceHistory({ page: 1, limit: PAGE_SIZE })
        .then(data => {
          setPresences(data?.presences ?? (Array.isArray(data) ? data : []))
          setTotalPages(data?.pages || 1)
        })
        .finally(() => setLoading(false))
    }
  }, [view])

  // Scanner QR
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
              loadToday()
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
      if (data._id) { toast.success("Sortie enregistrée"); loadToday() }
      else toast.error(data.message || "Erreur")
    } catch {
      toast.error("Erreur serveur")
    }
  }

  const handlePageChange = (newPage) => {
    setLoading(true)
    setPage(newPage)
    getPresenceHistory({ page: newPage, limit: PAGE_SIZE })
      .then(data => {
        setPresences(data?.presences ?? [])
        setTotalPages(data?.pages || 1)
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <Navbar />

      <div className="w-full px-4 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="overline mb-1">Admin</p>
            <h1 className="text-xl md:text-3xl font-black text-primary">Présence</h1>
          </div>
          <span className="badge badge-primary mt-1">{presences.length} entrées</span>
        </div>

        {/* Toggle */}
        <div className="toggle-wrap sm:max-w-xs">
          {[
            { key: "today",   label: "Aujourd'hui" },
            { key: "history", label: "Historique" },
          ].map(v => (
            <button
              key={v.key}
              onClick={() => { setView(v.key); setScanning(false) }}
              className={`toggle-btn ${view === v.key ? "toggle-btn-active" : ""}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* ── Vue Aujourd'hui : scanner + liste ── */}
        {view === "today" && (
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-6 lg:space-y-0">

            {/* Colonne gauche : scanner */}
            <div className="space-y-6">
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
                    <button onClick={() => setScanning(false)} className="btn btn-ghost w-full">Annuler</button>
                  </div>
                ) : (
                  <button onClick={() => setScanning(true)} className="btn btn-primary btn-lg w-full">
                    <Camera className="w-5 h-5" /> Démarrer le scan
                  </button>
                )}
              </div>

              {lastCheckin && (
                <div className="flex items-center gap-4 p-5 sm:rounded-2xl fade-in-up -mx-4 sm:mx-0" style={{ background: "#ecfdf5", borderTop: "1px solid #bbf7d0", borderBottom: "1px solid #bbf7d0" }}>
                  <CheckCircle className="w-9 h-9 shrink-0" style={{ color: "#059669" }} />
                  <div className="min-w-0">
                    <p className="font-black text-lg truncate" style={{ color: "#065f46" }}>{lastCheckin.user?.fullName}</p>
                    <p className="text-sm capitalize truncate" style={{ color: "#059669" }}>{lastCheckin.user?.role} · {lastCheckin.user?.department}</p>
                    <p className="text-xs mt-1" style={{ color: "#6ee7b7" }}>
                      Entrée à {fmt(lastCheckin.checkIn)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Colonne droite : liste du jour */}
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
                        <p className="font-semibold text-sm text-primary truncate">{p.user?.fullName}</p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          {fmt(p.checkIn)}{p.checkOut && ` → ${fmt(p.checkOut)}`}
                        </p>
                        {p.scannedBy && (
                          <p className="text-xs" style={{ color: "var(--muted)" }}>
                            Par : <span className="font-medium">{p.scannedBy.fullName}</span>
                          </p>
                        )}
                      </div>
                      {p.checkOut ? (
                        <span className="badge badge-gray shrink-0">Sorti</span>
                      ) : (
                        <button
                          onClick={() => handleCheckOut(p._id)}
                          className="btn btn-sm btn-secondary flex items-center gap-1 shrink-0"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Sortir
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Vue Historique ── */}
        {view === "history" && (
          loading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="skeleton h-16" />)}</div>
          ) : presences.length === 0 ? (
            <div className="empty-state">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Aucune présence enregistrée</p>
            </div>
          ) : (
            <>
              <div className="row-list">
                {presences.map(p => {
                  const r = roleConfig[p.user?.role] || roleConfig.student
                  const initials = (p.user?.fullName || "?").split(" ").map(n => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase()
                  return (
                    <div key={p._id} className="row-item">
                      <div className="avatar avatar-lg shrink-0">{initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-semibold text-sm text-primary truncate">{p.user?.fullName}</p>
                          <span className={`badge ${r.cls} shrink-0`}>{r.label}</span>
                        </div>
                        <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{p.user?.department}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#cbd5e1" }}>
                          {new Date(p.checkIn).toLocaleDateString("fr-FR")} · {fmt(p.checkIn)}{" "}
                          → {p.checkOut ? fmt(p.checkOut) : <span style={{ color: "#059669" }}>En salle</span>}
                        </p>
                        {p.scannedBy && (
                          <p className="text-xs" style={{ color: "#cbd5e1" }}>
                            Par : <span className="font-medium">{p.scannedBy.fullName}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Page {page} / {totalPages}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-200 disabled:opacity-30 hover:border-primary transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-200 disabled:opacity-30 hover:border-primary transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )
        )}
      </div>
      <Footer />
    </div>
  )
}