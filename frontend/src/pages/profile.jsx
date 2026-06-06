import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  LogOut, BookOpen, Clock, CheckCircle, AlertCircle,
  X, Mail, Phone, GraduationCap, Hash,
  Maximize2, CreditCard, Heart, TrendingUp, BarChart2,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"
import { downloadCard } from "../utils/memberCard"
import { useUser } from "../contexts/AuthContext"
import { logout, getUserStats } from "../api/user"
import { getUserLoans } from "../api/loan"
import { getFavorites, removeFavorite } from "../api/user"
import { getSettings } from "../api/settings"
import Navbar from "../components/navbar"
import Footer from "../components/footer"
import { useTheme } from "../contexts/ThemeContext"
import toast from "react-hot-toast"

const roleLabel = { student: "Étudiant", employee: "Employé", admin: "Administrateur" }

const ROLE_STYLE = {
  student:  { bg: "rgba(37,99,235,0.15)",  color: "#2563eb" },
  employee: { bg: "rgba(124,58,237,0.15)", color: "#7c3aed" },
  admin:    { bg: "rgba(167,30,60,0.15)",  color: "#A71E3C" },
}

const STATUS = {
  borrowed: { label: "En cours",  icon: <Clock className="w-3 h-3" />,        color: "#2563eb", bg: "rgba(37,99,235,0.08)" },
  returned: { label: "Retourné",  icon: <CheckCircle className="w-3 h-3" />,  color: "#059669", bg: "rgba(5,150,105,0.08)" },
  late:     { label: "En retard", icon: <AlertCircle className="w-3 h-3" />,  color: "#e11d48", bg: "rgba(225,29,72,0.08)" },
}

function dueDate(borrowDate, days = 14) {
  const d = new Date(borrowDate)
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
}

export default function Profile() {
  const { user, setUser } = useUser()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [loans, setLoans] = useState([])
  const [loadingLoans, setLoadingLoans] = useState(true)
  const [activeTab, setActiveTab] = useState("emprunts")
  const [favorites, setFavorites] = useState([])
  const [stats, setStats] = useState(null)
  const [loanDays, setLoanDays] = useState(14)

  useEffect(() => {
    getSettings()
      .then(d => { if (d.loanDurationDays) setLoanDays(d.loanDurationDays) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!user) { setLoadingLoans(false); return }
    let cancelled = false
    getUserLoans(user._id)
      .then(data => { if (!cancelled) setLoans(Array.isArray(data) ? data : []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingLoans(false) })
    getFavorites().then(data => { if (!cancelled) setFavorites(Array.isArray(data) ? data : []) }).catch(() => {})
    getUserStats(user._id).then(data => { if (!cancelled) setStats(data) }).catch(() => {})
    return () => { cancelled = true }
  }, [user])

  const handleLogout = async () => {
    try { await logout() } catch { /* ignore */ }
    setUser(null)
    navigate("/")
    toast.success("Déconnecté")
  }

  const handleRemoveFavorite = async (bookId) => {
    try {
      await removeFavorite(bookId)
      setFavorites(fs => fs.filter(f => (f._id || f) !== bookId))
      toast.success("Retiré des favoris")
    } catch { toast.error("Erreur") }
  }

  if (!user) return null

  const dark = theme === "dark"
  const isAdmin = user.role === "admin"
  const initials = (user.fullName || "?").split(" ").map(n => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase()
  const rs = ROLE_STYLE[user.role] || ROLE_STYLE.student

  const activeLoans  = loans.filter(l => l.status === "borrowed")
  const returnedLoans = loans.filter(l => l.status === "returned")
  const lateLoans    = loans.filter(l => l.status === "late")

  const tabLoans = activeTab === "emprunts" ? [...lateLoans, ...activeLoans] : returnedLoans

  const TABS = [
    { key: "emprunts",       label: "En cours",     count: activeLoans.length + lateLoans.length },
    { key: "historique",     label: "Historique",   count: returnedLoans.length },
    { key: "favoris",        label: "Favoris",      count: favorites.length },
    { key: "statistiques",   label: "Statistiques", count: null },
  ]

  // Transformation byMonth (objet) → tableau pour Recharts
  const monthlyData = stats?.byMonth
    ? Object.entries(stats.byMonth).map(([month, emprunts]) => ({ month, emprunts }))
    : []
  const avgPerMonth = monthlyData.length > 0
    ? (monthlyData.reduce((s, d) => s + d.emprunts, 0) / monthlyData.length).toFixed(1)
    : "0"
  const readProgress = stats && stats.totalLoans > 0
    ? Math.round((stats.returnedLoans / stats.totalLoans) * 100)
    : 0

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <Navbar />

      {/* ── HEADER BANNER ── */}
      <div style={{ background: dark ? "linear-gradient(135deg, #1c0a0e 0%, #2e1018 100%)" : "linear-gradient(135deg, #040848 0%, #0a1260 100%)" }}>
        <div className="w-full px-4 sm:px-6 py-6 md:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center text-white text-xl lg:text-3xl font-black shadow-xl shrink-0" style={{ background: "#A71E3C" }}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full" style={{ background: rs.bg, color: rs.color }}>
                    {roleLabel[user.role]}
                  </span>
                </div>
                <h1 className="text-lg lg:text-2xl font-black text-white leading-tight truncate">{user.fullName}</h1>
                {(user.department || user.year) && (
                  <p className="text-white/45 text-xs sm:text-sm mt-0.5 truncate">{user.department}{user.year ? ` · ${user.year}` : ""}</p>
                )}
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-6">
              {[
                { value: activeLoans.length + lateLoans.length, label: "En cours",  color: "#60a5fa" },
                { value: returnedLoans.length,                   label: "Retournés", color: "#34d399" },
                { value: lateLoans.length,                       label: "En retard", color: "#fb7185" },
              ].map((s, i) => (
                <div key={i} className="text-center px-5" style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
                  <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs font-semibold text-white/40 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <button onClick={handleLogout} className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
              <LogOut className="w-3.5 h-3.5" /> Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Stats mobile */}
      <div className="lg:hidden w-full px-4 sm:px-6 py-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: activeLoans.length + lateLoans.length, label: "En cours",  color: "#2563eb", bg: "rgba(37,99,235,0.08)" },
            { value: returnedLoans.length,                   label: "Retournés", color: "#059669", bg: "rgba(5,150,105,0.08)" },
            { value: lateLoans.length,                       label: "En retard", color: "#e11d48", bg: "rgba(225,29,72,0.08)" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-3 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CONTENU PRINCIPAL ── */}
      <div className="w-full px-4 sm:px-6 py-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── COLONNE GAUCHE ── */}
          <div className="lg:col-span-4 space-y-4">

            {/* Stats lecture */}
            {stats && (
              <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-secondary" />
                  <p className="font-black text-primary text-sm">Statistiques de lecture</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg)" }}>
                    <p className="text-xl font-black text-primary">{stats.totalLoans}</p>
                    <p className="text-xs text-muted">Total emprunts</p>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg)" }}>
                    <p className="text-xl font-black text-primary">{stats.returnedLoans}</p>
                    <p className="text-xs text-muted">Livres lus</p>
                  </div>
                </div>
                {stats.favoriteCategory && (
                  <div className="mt-3 rounded-xl p-3" style={{ background: "var(--bg)" }}>
                    <p className="text-xs text-muted mb-1">Catégorie favorite</p>
                    <p className="font-bold text-primary text-sm">{stats.favoriteCategory}</p>
                  </div>
                )}
              </div>
            )}

            {/* QR Code */}
            <div className="rounded-2xl overflow-hidden" style={{ background: dark ? "linear-gradient(135deg, #1c0a0e 0%, #2d0f1c 100%)" : "linear-gradient(135deg, #040848 0%, #0e1a7a 100%)", border: "1px solid var(--border-md)" }}>
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div>
                  <p className="font-black text-white text-sm">Mon QR Code</p>
                  <p className="text-white/40 text-xs mt-0.5">Montre-le à la bibliothèque</p>
                </div>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <CreditCard className="w-4 h-4 text-white/70" />
                </div>
              </div>

              {user.qrCode ? (
                <div className="flex flex-col items-center px-5 pb-2">
                  <div className="p-4 rounded-2xl shadow-2xl" style={{ background: "var(--surface)" }}>
                    <img src={user.qrCode} alt="QR Code" className="w-44 h-44 lg:w-48 lg:h-48 block" />
                  </div>
                  <p className="text-white/35 text-xs text-center mt-3 leading-relaxed px-2">Disponible hors connexion après téléchargement</p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-44 mx-5 rounded-2xl text-sm" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
                  QR indisponible
                </div>
              )}

              {user.qrCode && (
                <div className="px-5 pb-5 pt-3 flex flex-col gap-2">
                  <button onClick={() => navigate("/mon-qr")} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all" style={{ background: "#A71E3C", color: "#fff" }}>
                    <Maximize2 className="w-4 h-4" /> Ouvrir en plein écran
                  </button>
                  {isAdmin && (
                    <button onClick={() => downloadCard(user)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                      <CreditCard className="w-3.5 h-3.5" /> Télécharger ma carte
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Informations */}
            <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="font-black text-primary text-sm">Informations</p>
              </div>

              <div>
                  {[
                    { icon: <Mail className="w-3.5 h-3.5" />,          label: "Email",       value: user.email },
                    { icon: <Phone className="w-3.5 h-3.5" />,         label: "Téléphone",   value: user.phone },
                    { icon: <GraduationCap className="w-3.5 h-3.5" />, label: "Département", value: user.department },
                    user.year && { icon: <Hash className="w-3.5 h-3.5" />, label: "Année", value: user.year },
                  ].filter(Boolean).map((item, i, arr) => (
                    <div key={i} className="flex items-center gap-3 py-2.5" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <span style={{ color: "#cbd5e1" }}>{item.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs" style={{ color: "var(--muted)" }}>{item.label}</p>
                        <p className="text-sm font-semibold text-primary truncate">{item.value || "—"}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Déconnexion */}
            <button onClick={handleLogout} className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors lg:hidden" style={{ background: "rgba(167,30,60,0.07)", color: "#A71E3C", border: "1px solid rgba(167,30,60,0.15)" }}>
              <LogOut className="w-4 h-4" /> Se déconnecter
            </button>
          </div>

          {/* ── COLONNE DROITE ── */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>

              {/* Tabs */}
              <div className="flex items-center mb-5 -mx-1">
                <div className="flex gap-1.5 flex-nowrap overflow-x-auto hide-scrollbar px-1 w-full">
                  {TABS.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0"
                      style={{ background: activeTab === tab.key ? (dark ? "#d42040" : "#040848") : (dark ? "rgba(212,32,64,0.07)" : "rgba(4,8,72,0.05)"), color: activeTab === tab.key ? "#fff" : "var(--muted)" }}>
                      {tab.label}
                      {tab.count !== null && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-black"
                          style={{ background: activeTab === tab.key ? "rgba(255,255,255,0.2)" : (dark ? "rgba(212,32,64,0.1)" : "rgba(4,8,72,0.08)"), color: activeTab === tab.key ? "#fff" : "var(--muted)" }}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emprunts en cours / historique */}
              {(activeTab === "emprunts" || activeTab === "historique") && (
                loadingLoans ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />)}
                  </div>
                ) : tabLoans.length === 0 ? (
                  <div className="flex flex-col items-center py-20" style={{ color: "var(--muted)" }}>
                    <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                    <p className="font-semibold text-sm">{activeTab === "emprunts" ? "Aucun emprunt en cours" : "Aucun livre retourné"}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tabLoans.map(loan => {
                      const s = STATUS[loan.status] || STATUS.borrowed
                      return (
                        <div key={loan._id} className="flex gap-3 p-3 rounded-2xl cursor-pointer transition-all hover:shadow-sm"
                          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                          onClick={() => loan.book?._id && navigate(`/book/${loan.book._id}`)}>
                          {loan.book?.cover ? (
                            <img src={loan.book.cover} alt={loan.book.title} loading="lazy" className="w-12 h-16 object-cover rounded-xl shrink-0 shadow-sm" />
                          ) : (
                            <div className="w-12 h-16 rounded-xl shrink-0 flex items-center justify-center" style={{ background: "#e2e8f0" }}>
                              <BookOpen className="w-4 h-4" style={{ color: "var(--muted)" }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                            <div>
                              <p className="font-black text-sm text-primary leading-tight truncate">{loan.book?.title || "Livre inconnu"}</p>
                              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>
                                {Array.isArray(loan.book?.author) ? loan.book.author[0] : loan.book?.author}
                              </p>
                            </div>
                            <div className="flex items-center justify-between mt-1.5 gap-2">
                              <span className="text-xs truncate" style={{ color: "var(--muted)" }}>
                                {loan.status === "returned"
                                  ? `Rendu le ${new Date(loan.returnDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
                                  : `Avant le ${dueDate(loan.borrowDate, loanDays)}`}
                              </span>
                              <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: s.bg, color: s.color }}>
                                {s.icon} {s.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              )}

              {/* Favoris */}
              {activeTab === "favoris" && (
                favorites.length === 0 ? (
                  <div className="flex flex-col items-center py-20" style={{ color: "var(--muted)" }}>
                    <Heart className="w-12 h-12 mb-3 opacity-20" />
                    <p className="font-semibold text-sm">Aucun favori</p>
                    <p className="text-xs mt-1">Ajoutez des livres à vos favoris depuis leur page</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {favorites.map(book => (
                      <div key={book._id || book} className="relative group cursor-pointer" onClick={() => navigate(`/book/${book._id || book}`)}>
                        {book.cover ? (
                          <img src={book.cover} alt={book.title} loading="lazy" className="w-full aspect-[2/3] object-cover rounded-2xl shadow-md" />
                        ) : (
                          <div className="w-full aspect-[2/3] rounded-2xl bg-gray-100 flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                        <div className="mt-2">
                          <p className="font-bold text-sm text-primary truncate">{book.title}</p>
                          <p className="text-xs text-gray-400 truncate">{Array.isArray(book.author) ? book.author[0] : book.author}</p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); handleRemoveFavorite(book._id || book) }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow">
                          <X className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}
              {/* Statistiques */}
              {activeTab === "statistiques" && (
                !stats ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl skeleton" />)}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Cartes stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Livres lus",        value: stats.returnedLoans,   icon: <CheckCircle className="w-4 h-4" />, color: "#059669", bg: "rgba(5,150,105,0.1)" },
                        { label: "Catégorie favorite", value: stats.favoriteCategory || "—", icon: <BookOpen className="w-4 h-4" />,    color: "#2563eb", bg: "rgba(37,99,235,0.1)" },
                        { label: "Moy. / mois",        value: avgPerMonth,           icon: <TrendingUp className="w-4 h-4" />, color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
                        { label: "En retard",          value: stats.lateLoans,       icon: <AlertCircle className="w-4 h-4" />, color: "#e11d48", bg: "rgba(225,29,72,0.1)" },
                      ].map((s, i) => (
                        <div key={i} className="rounded-2xl p-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: s.bg, color: s.color }}>
                            {s.icon}
                          </div>
                          <p className="text-lg font-black truncate" style={{ color: "var(--fg)" }}>{s.value}</p>
                          <p className="text-xs font-medium mt-0.5" style={{ color: "var(--muted)" }}>{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Graphique mensuel */}
                    <div className="rounded-2xl p-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                      <p className="text-sm font-black mb-4 flex items-center gap-2" style={{ color: "var(--fg)" }}>
                        <BarChart2 className="w-4 h-4" style={{ color: dark ? "#d42040" : "#040848" }} />
                        Emprunts des 6 derniers mois
                      </p>
                      {monthlyData.length === 0 ? (
                        <div className="flex flex-col items-center py-8" style={{ color: "var(--muted)" }}>
                          <BarChart2 className="w-10 h-10 mb-2 opacity-20" />
                          <p className="text-sm font-semibold">Pas encore de données</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={160}>
                          <AreaChart data={monthlyData} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
                            <defs>
                              <linearGradient id="statsGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor={dark ? "#d42040" : "#040848"} stopOpacity={0.18} />
                                <stop offset="95%" stopColor={dark ? "#d42040" : "#040848"} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                            <Tooltip
                              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.75rem", fontSize: "12px", color: "var(--fg)" }}
                              formatter={(v) => [`${v} emprunt${v > 1 ? "s" : ""}`, ""]}
                            />
                            <Area type="monotone" dataKey="emprunts" stroke={dark ? "#d42040" : "#040848"} strokeWidth={2} fill="url(#statsGrad)" dot={{ r: 3, fill: dark ? "#d42040" : "#040848" }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    {/* Barre de progression lecture */}
                    {stats.totalLoans > 0 && (
                      <div className="rounded-2xl p-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold" style={{ color: "var(--fg)" }}>Livres lus</p>
                          <p className="text-sm font-black" style={{ color: dark ? "#d42040" : "#040848" }}>{readProgress}%</p>
                        </div>
                        <div className="w-full h-3 rounded-full" style={{ background: "var(--border-md)" }}>
                          <div
                            className="h-3 rounded-full transition-all duration-500"
                            style={{ width: `${readProgress}%`, background: dark ? "#d42040" : "linear-gradient(90deg, #040848, #A71E3C)" }}
                          />
                        </div>
                        <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                          {stats.returnedLoans} livre{stats.returnedLoans > 1 ? "s" : ""} retourné{stats.returnedLoans > 1 ? "s" : ""} sur {stats.totalLoans} emprunté{stats.totalLoans > 1 ? "s" : ""}
                        </p>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}