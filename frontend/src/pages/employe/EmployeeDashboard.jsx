import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { QrCode, BookOpen, Users, Clock, AlertCircle, BookMarked } from "lucide-react"
import Navbar from "../../components/navbar"
import Footer from "../../components/footer"
import { useUser } from "../../contexts/AuthContext"
import { getTodayPresence } from "../../api/presence"
import { getAllLoans } from "../../api/loan"

export default function EmployeeDashboard() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [presences, setPresences] = useState([])
  const [loans, setLoans] = useState([])
  const [dashStats, setDashStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getTodayPresence(),
      getAllLoans(),
      fetch(`${import.meta.env.VITE_API_URL}/loan/dashboard-stats`, { credentials: "include" }).then(r => r.json()),
    ])
      .then(([p, l, ds]) => {
        setPresences(Array.isArray(p) ? p : [])
        setLoans(Array.isArray(l) ? l : [])
        setDashStats(ds)
      })
      .finally(() => setLoading(false))
  }, [])

  const activeLoans = loans.filter(l => l.status === "borrowed" || l.status === "late")
  const firstName = user?.fullName?.split(" ")[0] || "Employé"

  const stats = [
    { icon: <Users className="w-5 h-5" />,      value: loading ? "…" : presences.length,                             label: "Présences aujourd'hui", iconBg: "rgba(124,58,237,0.10)", iconColor: "#7c3aed" },
    { icon: <BookOpen className="w-5 h-5" />,    value: loading ? "…" : activeLoans.length,                           label: "Emprunts actifs",       iconBg: "rgba(37,99,235,0.10)",  iconColor: "#2563eb" },
    { icon: <Clock className="w-5 h-5" />,       value: loading ? "…" : loans.filter(l => l.status === "late").length, label: "En retard",             iconBg: "rgba(225,29,72,0.10)",  iconColor: "#e11d48" },
    { icon: <AlertCircle className="w-5 h-5" />, value: loading ? "…" : (dashStats?.dueToday || 0),                   label: "Retours prévus auj.",   iconBg: "rgba(245,158,11,0.10)", iconColor: "#d97706" },
    { icon: <BookMarked className="w-5 h-5" />,  value: loading ? "…" : (dashStats?.pendingReservations || 0),        label: "Réservations dispos",   iconBg: "rgba(5,150,105,0.10)",  iconColor: "#059669" },
  ]

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #040848 0%, #0a1260 100%)" }} className="text-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <p className="overline-white mb-1">Interface Employé</p>
          <h1 className="text-3xl md:text-4xl font-black">Bonjour, {firstName} 👋</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Actions rapides */}
        <div>
          <p className="overline mb-4">Actions rapides</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => navigate("/employe/presence")}
              className="text-white rounded-2xl p-8 flex flex-col gap-4 text-left transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #040848 0%, #0a1260 100%)" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
                <QrCode className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xl font-black">Scanner une présence</p>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>Scan le QR code d'un lecteur pour l'enregistrer</p>
              </div>
            </button>

            <button onClick={() => navigate("/employe/pret")}
              className="text-white rounded-2xl p-8 flex flex-col gap-4 text-left transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #A71E3C 0%, #8b1730 100%)" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xl font-black">Enregistrer un prêt</p>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>Saisir un emprunt ou retour de livre</p>
              </div>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div>
          <p className="overline mb-4">Statistiques</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-icon" style={{ background: s.iconBg }}>
                  <span style={{ color: s.iconColor }}>{s.icon}</span>
                </div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Retours prévus aujourd'hui */}
        {dashStats?.dueTodayLoans?.length > 0 && (
          <div>
            <p className="overline mb-4">Retours prévus aujourd'hui</p>
            <div className="row-list">
              {dashStats.dueTodayLoans.map(loan => (
                <div key={loan._id} className="row-item">
                  <div className="avatar avatar-md">
                    {loan.user?.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-primary">{loan.user?.fullName || "—"}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{loan.book?.title || "—"}</p>
                  </div>
                  <span className="badge badge-yellow">À rendre</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Présences du jour */}
        <div>
          <p className="overline mb-4">Présences du jour</p>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-14" />)}</div>
          ) : presences.length === 0 ? (
            <div className="empty-state">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Aucune présence enregistrée aujourd'hui</p>
            </div>
          ) : (
            <div className="row-list">
              {presences.slice(0, 5).map(p => (
                <div key={p._id} className="row-item">
                  <div className="avatar avatar-md">
                    {p.user?.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-primary">{p.user?.fullName}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{new Date(p.checkIn).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  {p.checkOut
                    ? <span className="badge badge-gray">Sorti</span>
                    : <span className="badge badge-green">En salle</span>
                  }
                </div>
              ))}
              {presences.length > 5 && (
                <div className="px-5 py-3 text-center">
                  <button onClick={() => navigate("/employe/presence")} className="text-sm font-bold text-secondary hover:underline">
                    Voir tout ({presences.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
      <Footer />
    </div>
  )
}