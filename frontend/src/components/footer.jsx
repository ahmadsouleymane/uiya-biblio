import { BookOpen, Mail, MapPin, Phone } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTheme } from "../contexts/ThemeContext"

const categories = [
  "Philosophie",
  "Droit",
  "Communication",
  "Littérature ivoirienne",
  "Développement personnel",
  "Sciences économiques et de gestion",
]

export default function Footer() {
  const navigate = useNavigate()
  const { theme } = useTheme()

  return (
    <footer className="mt-auto pb-28 md:pb-0" style={{
      background: theme === "dark" ? "#100c0c" : "#040848",
      borderTop: theme === "dark" ? "1px solid rgba(167,30,60,0.15)" : "none",
    }}>
      {/* Main content */}
      <div className="w-full px-4 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="text-white text-xl font-black tracking-tight uppercase">Bibliothèque UIYA</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              La bibliothèque numérique de votre établissement. Consultez, empruntez et gérez vos livres en toute simplicité.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <a href="https://www.google.com/maps/place/Universit%C3%A9+Internationale+de+Yamoussoukro/@6.8521928,-5.2476374,1141m/data=!3m2!1e3!4b1!4m6!3m5!1s0xfb897d90ebbd2c9:0x6a38973e64b9ef19!8m2!3d6.8521875!4d-5.2450625!16s%2Fg%2F11h91lddq7?entry=ttu&g_ep=EgoyMDI2MDMxOC4xIKXMDSoASAFQAw%3D%3D" className="text-white/40 hover:text-white transition-colors">
                  Yamoussoukro, Côte d'Ivoire
                </a>
              </div>
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <a href="mailto:valentinkiendrebeogo22@gmail.com" className="text-white/40 hover:text-white transition-colors">
                  valentinkiendrebeogo22@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <a href="tel:+2250758505990" className="text-white/40 hover:text-white transition-colors">
                  +225 07 58 50 59 90
                </a>
              </div>
            </div>
          </div>

          {/* Catalogue */}
          <div className="space-y-4">
            <p className="text-white text-sm font-bold uppercase tracking-widest">Catalogue</p>
            <ul className="space-y-2.5">
              {categories.map(cat => (
                <li key={cat}>
                  <button
                    onClick={() => navigate(`/category/${cat.toLowerCase()}`)}
                    className="text-white/50 hover:text-white text-sm transition-colors text-left"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <p className="text-white text-sm font-bold uppercase tracking-widest">Navigation</p>
            <ul className="space-y-2.5">
              {[
                { label: "Accueil", to: "/" },
                { label: "Tous les livres", to: "/category/tous" },
                { label: "Mon profil", to: "/profile" },
                { label: "Mon activité", to: "/activity" },
              ].map(link => (
                <li key={link.to}>
                  <button
                    onClick={() => navigate(link.to)}
                    className="text-white/50 hover:text-white text-sm transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="w-full px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/30 text-xs">© {new Date().getFullYear()} Tous droits réservés - Fait par <a href="https://justmaley.vercel.app/" className="text-secondary font-bold cursor-pointer">JustMaley</a> </p>
        </div>
      </div>
    </footer>
  )
}
