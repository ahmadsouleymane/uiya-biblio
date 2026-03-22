import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, BookOpen, Clock, X } from "lucide-react"
import toast from "react-hot-toast"
import Navbar from "../../components/navbar"
import Footer from "../../components/footer"
import { getAllReservations, cancelReservation } from "../../api/reservation"

const STATUS_LABEL = { pending: "En attente", available: "Disponible", cancelled: "Annulée", expired: "Expirée" }
const STATUS_COLOR = { pending: "text-yellow-400", available: "text-green-400", cancelled: "text-muted", expired: "text-red-400" }

export default function AdminReservations() {
  const navigate = useNavigate()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("pending")

  const load = async () => {
    setLoading(true)
    try {
      const data = await getAllReservations(filterStatus ? { status: filterStatus } : {})
      setReservations(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filterStatus])

  const handleCancel = async (id) => {
    if (!confirm("Annuler cette réservation ?")) return
    try {
      await cancelReservation(id)
      toast.success("Réservation annulée")
      load()
    } catch {
      toast.error("Erreur")
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate("/admin")} className="w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:bg-surface/80 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black">Réservations</h1>
            <p className="text-muted text-sm">{reservations.length} réservation(s)</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {["", "pending", "available", "cancelled", "expired"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`btn btn-sm ${filterStatus === s ? "btn-primary" : "btn-ghost"}`}>
              {s === "" ? "Toutes" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : reservations.length === 0 ? (
          <div className="text-center text-muted py-16">Aucune réservation</div>
        ) : (
          <div className="space-y-3">
            {reservations.map(r => (
              <div key={r._id} className="card p-4 flex items-center gap-4">
                {r.book?.cover ? (
                  <img src={r.book.cover} alt="" className="w-12 h-16 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-12 h-16 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-muted" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{r.book?.title || "—"}</p>
                  <p className="text-muted text-sm">{r.user?.fullName || "—"} — {r.user?.department || ""}</p>
                  <p className="text-xs text-muted flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                    {r.notifiedAt && ` · Notifié le ${new Date(r.notifiedAt).toLocaleDateString("fr-FR")}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                  {["pending", "available"].includes(r.status) && (
                    <button onClick={() => handleCancel(r._id)} className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}