import { Menu, X, User, LayoutDashboard, BookOpen, Users, ArrowLeftRight, CalendarCheck, QrCode, Home, LogOut, Plus, PartyPopper, Bell, Sun, Moon } from 'lucide-react'
import logoUrl from '../assets/logo.svg'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { logout } from '../api/user'
import { getMyNotifications, markRead, markAllRead } from '../api/notification'
import toast from 'react-hot-toast'

const linksByRole = {
  student: [
    { to: "/",            label: "Accueil",      icon: <Home className="w-4 h-4" /> },
    { to: "/activity",    label: "Activité",     icon: <ArrowLeftRight className="w-4 h-4" /> },
  ],
  employee: [
    { to: "/employe",          label: "Accueil",       icon: <Home className="w-4 h-4" /> },
    { to: "/employe/presence", label: "Présence",      icon: <QrCode className="w-4 h-4" /> },
    { to: "/employe/pret",     label: "Prêts",         icon: <ArrowLeftRight className="w-4 h-4" /> },
    { to: "/add-book",         label: "Ajouter",       icon: <Plus className="w-4 h-4" /> },
  ],
  admin: [
    { to: "/admin",                 label: "Dashboard",    icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: "/admin/livres",          label: "Livres",       icon: <BookOpen className="w-4 h-4" /> },
    { to: "/admin/utilisateurs",    label: "Utilisateurs", icon: <Users className="w-4 h-4" /> },
    { to: "/admin/emprunts",        label: "Emprunts",     icon: <ArrowLeftRight className="w-4 h-4" /> },
    { to: "/admin/presence",        label: "Présence",     icon: <CalendarCheck className="w-4 h-4" /> },
    { to: "/activity",              label: "Activités",    icon: <PartyPopper className="w-4 h-4" /> },
  ],
  guest: [
    { to: "/", label: "Accueil", icon: <Home className="w-4 h-4" /> },
  ],
}

const NOTIF_ICONS = {
  loan_due:               "⏰",
  loan_late:              "⚠️",
  reservation_available:  "📚",
  fine_created:           "💸",
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60)   return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return `il y a ${Math.floor(diff / 86400)} j`
}

export default function Navbar() {
  const [menuOpen, setMenuOpen]         = useState(false)
  const [notifOpen, setNotifOpen]       = useState(false)
  const [notifications, setNotifications] = useState([])
  const notifRef = useRef(null)
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, setUser } = useUser()

  // Ferme le menu au changement de route
  useEffect(() => { setMenuOpen(false); setNotifOpen(false) }, [location.pathname])

  // Bloque le scroll quand le menu guest est ouvert
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Ferme le dropdown notifs au clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Charge les notifications
  useEffect(() => {
    if (!user) return
    const load = () => getMyNotifications().then(data => { if (Array.isArray(data)) setNotifications(data) }).catch(() => {})
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [user])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleNotifClick = async (notif) => {
    if (!notif.read) {
      await markRead(notif._id).catch(() => {})
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n))
    }
    setNotifOpen(false)
    if (notif.link) navigate(notif.link)
  }

  const handleMarkAllRead = async () => {
    await markAllRead().catch(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleLogout = async () => {
    await logout()
    setUser(null)
    toast.success("Déconnecté")
    navigate("/")
  }

  const { theme, toggleTheme } = useTheme()

  const role = user?.role || 'guest'
  const links = linksByRole[role] || linksByRole.guest
  const active = (path) => location.pathname === path

  return (
    <>
      <div
        className="sticky top-0 z-40 text-white"
        style={{ background: "#040848", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="max-w-6xl mx-auto h-[62px] px-4 flex items-center justify-between gap-4">

          {/* Logo */}
          <img
            src={logoUrl}
            alt="Logo"
            className="h-9 shrink-0 cursor-pointer"
            onClick={() => navigate(role === 'admin' ? '/admin' : role === 'employee' ? '/employe' : '/')}
          />

          {/* ── Desktop : liens de navigation ── */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {links.map(l => (
              <button
                key={l.to}
                onClick={() => navigate(l.to)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: active(l.to) ? "rgba(255,255,255,0.12)" : "transparent",
                  color: active(l.to) ? "#ffffff" : "rgba(255,255,255,0.50)",
                }}
                onMouseEnter={e => { if (!active(l.to)) e.currentTarget.style.color = "#fff" }}
                onMouseLeave={e => { if (!active(l.to)) e.currentTarget.style.color = "rgba(255,255,255,0.50)" }}
              >
                {l.icon} {l.label}
              </button>
            ))}
          </nav>

          {/* ── Desktop : auth + cloche ── */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {/* Toggle thème */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
              style={{ background: "rgba(255,255,255,0.08)" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.14)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <>
                {/* Cloche */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(o => !o)}
                    className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
                    style={{ background: notifOpen ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.08)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.14)"}
                    onMouseLeave={e => e.currentTarget.style.background = notifOpen ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.08)"}
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white font-black"
                        style={{ background: "#A71E3C", fontSize: "0.6rem", padding: "0 4px" }}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown notifications */}
                  {notifOpen && (
                    <div
                      className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", top: "100%" }}
                    >
                      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                        <p className="text-sm font-black" style={{ color: "var(--fg)" }}>Notifications</p>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs font-semibold"
                            style={{ color: "#A71E3C" }}
                          >
                            Tout marquer lu
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-center py-8" style={{ color: "var(--muted)" }}>Aucune notification</p>
                        ) : (
                          notifications.map(n => (
                            <button
                              key={n._id}
                              onClick={() => handleNotifClick(n)}
                              className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                              style={{ borderBottom: "1px solid var(--border)", background: n.read ? "transparent" : "rgba(167,30,60,0.04)" }}
                              onMouseEnter={e => e.currentTarget.style.background = "var(--row-hover)"}
                              onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : "rgba(167,30,60,0.04)"}
                            >
                              <span className="text-lg shrink-0 mt-0.5">{NOTIF_ICONS[n.type] || "🔔"}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs leading-snug" style={{ color: "var(--fg)", fontWeight: n.read ? 400 : 600 }}>
                                  {n.message}
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{timeAgo(n.createdAt)}</p>
                              </div>
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: "#A71E3C" }} />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.14)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                >
                  <User className="w-4 h-4" />
                  {user.fullName.split(' ')[0]}
                </button>
                <button
                  onClick={handleLogout}
                  title="Se déconnecter"
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm transition-colors"
                  style={{ color: "rgba(255,255,255,0.40)" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.08)" }}
                  onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.40)"; e.currentTarget.style.background = "transparent" }}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/connexion')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.75)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  Connexion
                </button>
                <button
                  onClick={() => navigate('/inscription')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "#A71E3C" }}
                >
                  S'inscrire
                </button>
              </>
            )}
          </div>

          {/* ── Mobile : toggle thème + cloche + avatar si connecté, hamburger si guest ── */}
          <div className="md:hidden flex items-center gap-2">
            {/* Toggle thème mobile */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: "rgba(255,255,255,0.08)" }}
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {user ? (
              <>
                {/* Cloche mobile */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(o => !o)}
                    className="relative flex items-center justify-center w-9 h-9 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white font-black"
                        style={{ background: "#A71E3C", fontSize: "0.6rem", padding: "0 4px" }}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div
                      className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", top: "100%", zIndex: 60 }}
                    >
                      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                        <p className="text-sm font-black" style={{ color: "var(--fg)" }}>Notifications</p>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-xs font-semibold" style={{ color: "#A71E3C" }}>
                            Tout marquer lu
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-center py-8" style={{ color: "var(--muted)" }}>Aucune notification</p>
                        ) : (
                          notifications.map(n => (
                            <button
                              key={n._id}
                              onClick={() => handleNotifClick(n)}
                              className="w-full flex items-start gap-3 px-4 py-3 text-left"
                              style={{ borderBottom: "1px solid var(--border)", background: n.read ? "transparent" : "rgba(167,30,60,0.04)" }}
                              onMouseEnter={e => e.currentTarget.style.background = "var(--row-hover)"}
                              onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : "rgba(167,30,60,0.04)"}
                            >
                              <span className="text-lg shrink-0 mt-0.5">{NOTIF_ICONS[n.type] || "🔔"}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs leading-snug" style={{ color: "var(--fg)", fontWeight: n.read ? 400 : 600 }}>
                                  {n.message}
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{timeAgo(n.createdAt)}</p>
                              </div>
                              {!n.read && <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: "#A71E3C" }} />}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar */}
                <button
                  onClick={() => navigate('/profile')}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black"
                  style={{ background: "#A71E3C", fontSize: "0.7rem" }}
                >
                  {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </button>
              </>
            ) : (
              /* Guest → hamburger menu */
              <button
                className="w-9 h-9 flex items-center justify-center rounded-xl"
                style={{ background: "rgba(255,255,255,0.08)" }}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ── Menu mobile guest uniquement ── */}
      {!user && menuOpen && (
        <div
          className="md:hidden fixed inset-0 top-[62px] z-50 flex flex-col px-4 py-8 gap-3"
          style={{ background: "#040848" }}
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 px-5 py-4 rounded-2xl text-base font-bold text-left"
            style={{ color: "rgba(255,255,255,0.70)", background: active('/') ? "rgba(255,255,255,0.10)" : "transparent" }}
          >
            <Home className="w-5 h-5" /> Accueil
          </button>

          <div className="mt-auto flex flex-col gap-3">
            <button
              onClick={() => navigate('/connexion')}
              className="w-full py-4 rounded-2xl font-bold text-base text-white"
              style={{ border: "1.5px solid rgba(255,255,255,0.18)" }}
            >
              Se connecter
            </button>
            <button
              onClick={() => navigate('/inscription')}
              className="w-full py-4 rounded-2xl font-bold text-base text-white"
              style={{ background: "#A71E3C" }}
            >
              S'inscrire
            </button>
          </div>
        </div>
      )}
    </>
  )
}
