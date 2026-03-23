import { useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useUser } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import {
  Home, User, QrCode, ArrowLeftRight, BookOpen,
  Users, CalendarCheck, LayoutDashboard, Plus, Activity,
} from "lucide-react"

const navByRole = {
  student: [
    { to: "/",          label: "Accueil",  Icon: Home },
    { to: "/activity",  label: "Activité", Icon: Activity },
    { to: "/profile",   label: "Profil",   Icon: User },
  ],
  employee: [
    { to: "/employe",          label: "Accueil",  Icon: Home },
    { to: "/employe/presence", label: "Présence", Icon: QrCode },
    { to: "/employe/pret",     label: "Prêts",    Icon: ArrowLeftRight },
    { to: "/add-book",         label: "Ajouter",  Icon: Plus },
    { to: "/profile",          label: "Profil",   Icon: User },
  ],
  admin: [
    { to: "/admin",              label: "Dashboard", Icon: LayoutDashboard },
    { to: "/admin/livres",       label: "Livres",    Icon: BookOpen },
    { to: "/admin/utilisateurs", label: "Membres",   Icon: Users },
    { to: "/admin/emprunts",     label: "Prêts",     Icon: ArrowLeftRight },
    { to: "/admin/presence",     label: "Présence",  Icon: CalendarCheck },
  ],
}

const HIDDEN_ROUTES = ["/connexion", "/inscription", "/mon-qr", "/mot-de-passe-oublie"]

export default function BottomNav() {
  const { user } = useUser()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const visible = !!user && !HIDDEN_ROUTES.includes(pathname) && !pathname.startsWith("/reinitialiser-mdp")

  useEffect(() => {
    return () => { document.body.style.paddingBottom = "0" }
  }, [visible])

  if (!visible) return null

  const { theme } = useTheme()
  const items = navByRole[user.role] || navByRole.student
  const isActive = (to) => pathname === to
  const dark = theme === "dark"

  // Couleurs selon le thème
  const bg          = dark ? "#100c0c" : "var(--surface)"
  const borderTop   = dark ? "1px solid rgba(167,30,60,0.18)" : "1px solid var(--border)"
  const activeColor  = dark ? "#d42040" : "#040848"
  const inactiveColor = dark ? "rgba(240,235,232,0.35)" : "var(--muted)"
  const activeBg    = dark ? "rgba(212,32,64,0.12)" : "rgba(4,8,72,0.07)"

  return (
    /* md:hidden — visible uniquement sur mobile */
    <nav
      className="md:hidden flex items-center justify-around px-1"
      style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        zIndex: 60,
        background: bg,
        borderTop,
        boxShadow: dark
          ? "0 -8px 32px rgba(0,0,0,0.55)"
          : "0 -4px 20px rgba(4,8,72,0.08)",
        height: "64px",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {items.map(({ to, label, Icon }) => {
        const active = isActive(to)
        return (
          <button
            key={to}
            onClick={() => navigate(to)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              padding: "6px 4px",
              borderRadius: "12px",
              background: active ? activeBg : "transparent",
              transition: "all 0.15s",
              position: "relative",
            }}
          >
            {/* Indicateur actif en haut */}
            {active && (
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "20px",
                  height: "2.5px",
                  borderRadius: "0 0 4px 4px",
                  background: activeColor,
                }}
              />
            )}

            <Icon
              size={21}
              color={active ? activeColor : inactiveColor}
              strokeWidth={active ? 2.5 : 1.8}
            />
            <span
              style={{
                fontSize: "9px",
                fontWeight: active ? 800 : 500,
                color: active ? activeColor : inactiveColor,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                lineHeight: 1,
              }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
