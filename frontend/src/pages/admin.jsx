import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  BookOpen, Users, ArrowLeftRight, CalendarCheck,
  AlertCircle, CheckCircle, TrendingUp, Clock,
  Download, FileText, Settings, Shield, Upload, Award, Sparkles, Loader2, MessageCircle,
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts"
import Navbar from "../components/navbar"
import Footer from "../components/footer"
import { getAdminStats, exportPdf as exportPdfApi, getEmployeeBookRanking } from "../api/stats"
import { generateAllBookDescriptions } from "../api/book"
import { apiFetch } from "../api/_fetch"
import { useUser } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import toast from "react-hot-toast"

// ── Tooltip personnalisé ────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl shadow-xl p-3 text-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      {label && <p className="font-bold text-primary mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name} : <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null
  const R = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + R * Math.cos(-midAngle * Math.PI / 180)
  const y = cy + R * Math.sin(-midAngle * Math.PI / 180)
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {`${Math.round(percent * 100)}%`}
    </text>
  )
}

// ── Types d'export ──────────────────────────────────────────────────
const EXPORT_TYPES = [
  {
    key: "loans",
    label: "Emprunts",
    desc: "Historique des prêts",
    icon: <ArrowLeftRight className="w-5 h-5" />,
    hasPeriod: true,
    color: "#ea580c",
    bg: "rgba(234,88,12,0.08)",
  },
  {
    key: "presence",
    label: "Présences",
    desc: "Entrées et sorties",
    icon: <CalendarCheck className="w-5 h-5" />,
    hasPeriod: true,
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.08)",
  },
  {
    key: "users",
    label: "Utilisateurs",
    desc: "Comptes inscrits",
    icon: <Users className="w-5 h-5" />,
    hasPeriod: true,
    color: "#2563eb",
    bg: "rgba(37,99,235,0.08)",
  },
  {
    key: "books",
    label: "Catalogue",
    desc: "Tous les livres",
    icon: <BookOpen className="w-5 h-5" />,
    hasPeriod: false,
    color: "#059669",
    bg: "rgba(5,150,105,0.08)",
  },
]

export default function Admin() {
  const { user } = useUser()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const dark = theme === "dark"
  const chartColor = dark ? "#d42040" : "#040848"
  const chartAlpha = dark ? "rgba(212,32,64," : "rgba(4,8,72,"
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const [ranking, setRanking]   = useState([])
  const [rankingLoading, setRankingLoading] = useState(true)
  const [generatingDescs, setGeneratingDescs] = useState(false)

  // Export state
  const [exportType, setExportType]     = useState("loans")
  const [exportFrom, setExportFrom]     = useState("")
  const [exportTo, setExportTo]         = useState("")
  const [exporting, setExporting]       = useState(false)
  const [exportFormat, setExportFormat] = useState("xlsx")

  useEffect(() => {
    getAdminStats()
      .then(data => {
        if (data?.message) { setError(true); return }
        setStats(data)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))

    getEmployeeBookRanking()
      .then(data => { if (Array.isArray(data)) setRanking(data) })
      .catch(() => {})
      .finally(() => setRankingLoading(false))
  }, [])

  // ── Export ────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true)
    try {
      const params = { type: exportType }
      if (exportFrom) params.from = exportFrom
      if (exportTo)   params.to   = exportTo

      const typeLabel = EXPORT_TYPES.find(t => t.key === exportType)?.label.toLowerCase() || exportType
      const ext = exportFormat === "pdf" ? "pdf" : "xlsx"
      const dateStr = new Date().toISOString().slice(0, 10)

      let res
      if (exportFormat === "pdf") {
        res = await exportPdfApi(params)
      } else {
        const query = new URLSearchParams(params).toString()
        res = await apiFetch(
          `${import.meta.env.VITE_API_URL}/stats/export?${query}`,
          { credentials: "include", method: "GET" }
        )
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.message || "Erreur lors de l'export")
        return
      }

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href     = url
      a.download = `export_${typeLabel}_${dateStr}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Export téléchargé !")
    } catch {
      toast.error("Erreur lors de l'export")
    } finally {
      setExporting(false)
    }
  }

  const selectedType = EXPORT_TYPES.find(t => t.key === exportType)

  // ── Stat cards ────────────────────────────────────────────────────
  const statCards = stats ? [
    { icon: <BookOpen className="w-5 h-5" />,       value: stats.totalBooks,     label: "Livres enregistrés",      iconBg: "rgba(37,99,235,0.10)",  iconColor: "#2563eb" },
    { icon: <CheckCircle className="w-5 h-5" />,    value: stats.availableBooks, label: "Exemplaires disponibles", iconBg: "rgba(5,150,105,0.10)",  iconColor: "#059669" },
    { icon: <Users className="w-5 h-5" />,          value: stats.totalUsers,     label: "Utilisateurs",            iconBg: "rgba(124,58,237,0.10)", iconColor: "#7c3aed" },
    { icon: <ArrowLeftRight className="w-5 h-5" />, value: stats.activeLoans,    label: "Emprunts actifs",         iconBg: "rgba(234,88,12,0.10)",  iconColor: "#ea580c" },
    { icon: <AlertCircle className="w-5 h-5" />,    value: stats.lateLoans,      label: "Emprunts en retard",      iconBg: "rgba(225,29,72,0.10)",  iconColor: "#e11d48" },
    { icon: <CalendarCheck className="w-5 h-5" />,  value: stats.todayPresence,  label: "Présences aujourd'hui",   iconBg: dark ? "rgba(212,32,64,0.08)" : "rgba(4,8,72,0.08)", iconColor: chartColor },
  ] : []

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: dark ? "linear-gradient(135deg, #1c0a0e 0%, #2e1018 100%)" : "linear-gradient(135deg, #040848 0%, #0a1260 100%)" }} className="text-white">
        <div className="w-full px-4 py-10">
          <p className="overline-white mb-1">Administration</p>
          <h1 className="text-3xl md:text-4xl font-black">Bonjour, {user?.fullName?.split(" ")[0]} 👋</h1>
        </div>
      </div>

      <div className="w-full px-4 py-8 space-y-10 pb-20">

        {/* ── Vue d'ensemble ─────────────────────────────────────── */}
        <div>
          <p className="overline mb-4">Vue d'ensemble</p>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-28" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {statCards.map((s, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-icon" style={{ background: s.iconBg }}>
                    <span style={{ color: s.iconColor }}>{s.icon}</span>
                  </div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Analytique ─────────────────────────────────────────── */}
        {loading ? (
          <div>
            <p className="overline mb-4">Analytique</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="skeleton h-64" />)}
            </div>
          </div>
        ) : error ? null : stats && (
          <div>
            <p className="overline mb-4">Analytique</p>

            {/* KPI supplémentaires */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                {
                  label: "Total emprunts historique",
                  value: stats.totalLoansAllTime,
                  icon: <TrendingUp className="w-4 h-4" />,
                  color: chartColor,
                  bg: `${chartAlpha}0.08)`,
                },
                {
                  label: "Taux de retard",
                  value: `${stats.lateRate}%`,
                  icon: <AlertCircle className="w-4 h-4" />,
                  color: stats.lateRate > 20 ? "#e11d48" : "#059669",
                  bg: stats.lateRate > 20 ? "rgba(225,29,72,0.08)" : "rgba(5,150,105,0.08)",
                },
                {
                  label: "Livres en retard actuellement",
                  value: stats.lateLoans,
                  icon: <Clock className="w-4 h-4" />,
                  color: "#ea580c",
                  bg: "rgba(234,88,12,0.08)",
                },
                {
                  label: "Présences aujourd'hui",
                  value: stats.todayPresence,
                  icon: <CalendarCheck className="w-4 h-4" />,
                  color: "#7c3aed",
                  bg: "rgba(124,58,237,0.08)",
                },
              ].map((k, i) => (
                <div key={i} className="card p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: k.bg, color: k.color }}>
                    {k.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-black" style={{ color: k.color }}>{k.value}</p>
                    <p className="text-xs leading-tight" style={{ color: "var(--muted)" }}>{k.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts 2×2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* 1. Tendance emprunts (6 mois) */}
              <div className="card p-5">
                <p className="font-black text-primary text-sm mb-1">Tendance des emprunts</p>
                <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>6 derniers mois</p>
                {stats.loansByMonth?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={stats.loansByMonth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradEmp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartColor} stopOpacity={0.18} />
                          <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradRet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e11d48" stopOpacity={0.18} />
                          <stop offset="100%" stopColor="#e11d48" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="emprunts" name="Emprunts"
                        stroke={chartColor} strokeWidth={2.5} fill="url(#gradEmp)" dot={{ r: 3, fill: chartColor }} />
                      <Area type="monotone" dataKey="retards" name="Retards"
                        stroke="#e11d48" strokeWidth={2} strokeDasharray="4 2" fill="url(#gradRet)" dot={{ r: 3, fill: "#e11d48" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-sm" style={{ color: "var(--muted)" }}>Pas encore de données</div>
                )}
                <div className="flex gap-4 mt-2 justify-center">
                  {[{ color: chartColor, label: "Emprunts" }, { color: "#e11d48", label: "Retards" }].map((l, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                      <span className="w-3 h-0.5 rounded inline-block" style={{ background: l.color }} /> {l.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Top 5 livres empruntés */}
              <div className="card p-5">
                <p className="font-black text-primary text-sm mb-1">Top 5 livres</p>
                <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Les plus empruntés</p>
                {stats.topBooks?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.topBooks.map((book, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-5 text-center text-xs font-black shrink-0" style={{ color: i === 0 ? "#ea580c" : "var(--muted)" }}>
                          #{i + 1}
                        </span>
                        {book.cover && (
                          <img src={book.cover} alt={book.title} className="w-8 h-11 object-cover rounded-lg shrink-0 shadow-sm" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-primary truncate">{book.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${chartAlpha}0.08)` }}>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.round((book.count / stats.topBooks[0].count) * 100)}%`,
                                  background: i === 0 ? chartColor : `${chartAlpha}${0.5 - i * 0.07})`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-bold shrink-0" style={{ color: "var(--muted)" }}>{book.count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-sm" style={{ color: "var(--muted)" }}>Aucun emprunt enregistré</div>
                )}
              </div>

              {/* 3. Répartition des rôles */}
              <div className="card p-5">
                <p className="font-black text-primary text-sm mb-1">Répartition des utilisateurs</p>
                <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Par rôle</p>
                {stats.userRoles?.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={stats.userRoles}
                          cx="50%" cy="50%"
                          innerRadius={50} outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          labelLine={false}
                          label={PieLabel}
                        >
                          {stats.userRoles.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 justify-center mt-1">
                      {stats.userRoles.map((r, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: r.color }} />
                          {r.name} <strong style={{ color: "var(--fg)" }}>({r.value})</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-sm" style={{ color: "var(--muted)" }}>Pas de données</div>
                )}
              </div>

              {/* 4. Livres par catégorie */}
              <div className="card p-5">
                <p className="font-black text-primary text-sm mb-1">Livres par catégorie</p>
                <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Top 8</p>
                {stats.booksPerCategory?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.booksPerCategory} layout="vertical"
                      margin={{ top: 0, right: 24, left: 0, bottom: 0 }} barSize={14}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name"
                        tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={105} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" name="Livres" radius={[0, 6, 6, 0]}>
                        {stats.booksPerCategory.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? chartColor : `${chartAlpha}${Math.max(0.15, 0.7 - i * 0.08)})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-sm" style={{ color: "var(--muted)" }}>Aucune donnée</div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ── Classement employés ────────────────────────────────── */}
        <div>
          <p className="overline mb-4">Classement des employés</p>
          {rankingLoading ? (
            <div className="skeleton h-48" />
          ) : ranking.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-sm" style={{ color: "var(--muted)" }}>Aucun livre ajouté par les employés pour le moment</p>
            </div>
          ) : (
            <div className="card p-5">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${chartAlpha}0.06)`, color: chartColor }}>
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-primary text-sm">Livres ajoutés par employé</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    Classement basé sur le nombre de livres enregistrés dans le catalogue
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {ranking.map((emp, i) => {
                  const medalColors = ["#f59e0b", "#94a3b8", "#b45309"]
                  const medalColor = i < 3 ? medalColors[i] : "var(--muted)"
                  const maxBooks = ranking[0]?.booksAdded || 1
                  return (
                    <div key={emp.userId} className="flex items-center gap-3 p-3 rounded-xl transition-all" style={{ background: i < 3 ? `${chartAlpha}0.03)` : "transparent" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-sm"
                        style={{
                          background: i < 3 ? medalColor : "var(--border)",
                          color: i < 3 ? "#fff" : "var(--muted)",
                        }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-primary truncate">{emp.fullName}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{
                            background: emp.role === "admin" ? "rgba(225,29,72,0.08)" : "rgba(124,58,237,0.08)",
                            color: emp.role === "admin" ? "#e11d48" : "#7c3aed",
                          }}>
                            {emp.role === "admin" ? "Admin" : "Employé"}
                          </span>
                        </div>
                        {emp.department && (
                          <p className="text-xs" style={{ color: "var(--muted)" }}>{emp.department}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${chartAlpha}0.08)` }}>
                            <div className="h-full rounded-full transition-all" style={{
                              width: `${Math.round((emp.booksAdded / maxBooks) * 100)}%`,
                              background: i === 0 ? chartColor : `${chartAlpha}${Math.max(0.2, 0.6 - i * 0.05)})`,
                            }} />
                          </div>
                          <span className="text-xs font-bold shrink-0" style={{ color: chartColor }}>
                            {emp.booksAdded} livre{emp.booksAdded > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs" style={{ color: "var(--muted)" }}>Dernier ajout</p>
                        <p className="text-xs font-semibold" style={{ color: "var(--fg)" }}>
                          {new Date(emp.lastAdded).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Export ─────────────────────────────────────────────── */}
        <div>
          <p className="overline mb-4">Export de données</p>
          <div className="card p-6 space-y-6">

            {/* Description */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${chartAlpha}0.06)`, color: chartColor }}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-primary text-sm">Télécharger les données</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  Génère un fichier Excel (.xlsx) ou PDF avec mise en page professionnelle. Filtre par période pour les données datées.
                </p>
              </div>
            </div>

            {/* Sélection du type */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>
                Type de données
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {EXPORT_TYPES.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setExportType(t.key)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center"
                    style={{
                      borderColor: exportType === t.key ? t.color : "var(--border)",
                      background:  exportType === t.key ? t.bg : "var(--surface)",
                    }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: exportType === t.key ? t.bg : "var(--border)", color: t.color }}>
                      {t.icon}
                    </div>
                    <div>
                      <p className="font-black text-xs" style={{ color: exportType === t.key ? t.color : "var(--fg)" }}>{t.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Période (affichée seulement si le type a hasPeriod) */}
            {selectedType?.hasPeriod && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>
                  Période <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optionnelle — vide = tout exporter)</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--muted)" }}>Du</label>
                    <input
                      type="date"
                      value={exportFrom}
                      onChange={e => setExportFrom(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border text-sm outline-none transition-colors"
                      style={{ borderColor: "var(--border-md)", background: "var(--bg)", color: "var(--fg)" }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--muted)" }}>Au</label>
                    <input
                      type="date"
                      value={exportTo}
                      onChange={e => setExportTo(e.target.value)}
                      min={exportFrom || undefined}
                      className="w-full h-11 px-4 rounded-xl border text-sm outline-none transition-colors"
                      style={{ borderColor: "var(--border-md)", background: "var(--bg)", color: "var(--fg)" }}
                    />
                  </div>
                  {(exportFrom || exportTo) && (
                    <div className="flex items-end">
                      <button
                        onClick={() => { setExportFrom(""); setExportTo("") }}
                        className="h-11 px-4 rounded-xl text-xs font-semibold transition-colors"
                        style={{ color: "var(--muted)", background: "var(--border)" }}
                      >
                        Effacer
                      </button>
                    </div>
                  )}
                </div>
                {exportFrom && exportTo && (
                  <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                    Période sélectionnée : du <strong style={{ color: "var(--fg)" }}>{new Date(exportFrom).toLocaleDateString("fr-FR")}</strong> au <strong style={{ color: "var(--fg)" }}>{new Date(exportTo).toLocaleDateString("fr-FR")}</strong>
                  </p>
                )}
              </div>
            )}

            {/* Format + Bouton télécharger */}
            <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              {/* Toggle format */}
              <div className="flex items-center gap-3 mb-4">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Format</p>
                <div className="toggle-wrap">
                  <button
                    onClick={() => setExportFormat("xlsx")}
                    className={`toggle-btn ${exportFormat === "xlsx" ? "toggle-btn-active" : ""}`}
                  >
                    Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => setExportFormat("pdf")}
                    className={`toggle-btn ${exportFormat === "pdf" ? "toggle-btn-active" : ""}`}
                  >
                    PDF
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center gap-2 px-6 h-12 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
                  style={{ background: selectedType?.color || "#040848", color: "#fff" }}
                >
                  {exporting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {exporting ? "Génération…" : `Télécharger ${selectedType?.label}`}
                </button>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {exportFormat === "pdf"
                    ? "Format PDF · Rapport paysage A4"
                    : "Format Excel (.xlsx) · Mise en page et couleurs incluses"}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ── Accès rapide nouvelles fonctionnalités ────────────── */}
        <div>
          <p className="overline mb-4">Gestion avancée</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Import CSV",   desc: "Livres & utilisateurs", icon: <Upload className="w-5 h-5" />,  color: "#2563eb", bg: "rgba(37,99,235,0.08)",    path: "/admin/import" },
              { label: "Paramètres",   desc: "Configuration",     icon: <Settings className="w-5 h-5" />,   color: "#7c3aed", bg: "rgba(124,58,237,0.08)",   path: "/admin/parametres" },
              { label: "Audit",        desc: "Journal d'actions", icon: <Shield className="w-5 h-5" />,     color: chartColor, bg: `${chartAlpha}0.08)`,    path: "/admin/audit" },
              { label: "WhatsApp",     desc: "Bot & notifications", icon: <MessageCircle className="w-5 h-5" />, color: "#25d366", bg: "rgba(37,211,102,0.08)", path: "/admin/whatsapp" },
            ].map((item, i) => (
              <button key={i} onClick={() => navigate(item.path)}
                className="card p-4 flex flex-col items-start gap-3 hover:shadow-md transition-all text-left">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: item.bg, color: item.color }}>
                  {item.icon}
                </div>
                <div>
                  <p className="font-black text-sm text-primary">{item.label}</p>
                  <p className="text-xs text-muted">{item.desc}</p>
                </div>
              </button>
            ))}
            {/* Bouton génération IA descriptions */}
            <button
              onClick={async () => {
                setGeneratingDescs(true)
                try {
                  const data = await generateAllBookDescriptions()
                  if (data.updated !== undefined) {
                    toast.success(`${data.updated}/${data.total} descriptions générées !`)
                    if (data.errors?.length > 0) {
                      toast(`${data.errors.length} erreur(s)`, { icon: "⚠️" })
                    }
                  } else {
                    toast(data.message || "Terminé", { icon: "ℹ️" })
                  }
                } catch {
                  toast.error("Erreur lors de la génération")
                } finally {
                  setGeneratingDescs(false)
                }
              }}
              disabled={generatingDescs}
              className="card p-4 flex flex-col items-start gap-3 hover:shadow-md transition-all text-left disabled:opacity-60"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(37,99,235,0.12))" }}>
                {generatingDescs ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#7c3aed" }} /> : <Sparkles className="w-5 h-5" style={{ color: "#7c3aed" }} />}
              </div>
              <div>
                <p className="font-black text-sm text-primary">{generatingDescs ? "Génération…" : "Descriptions IA"}</p>
                <p className="text-xs text-muted">Générer pour tous les livres</p>
              </div>
            </button>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  )
}