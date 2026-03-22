import { BookOpen, Mail, MapPin, Phone } from "lucide-react"
import { useNavigate } from "react-router-dom"

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

  return (
    <footer className="mt-auto pb-20 md:pb-0" style={{ background: "#040848" }}>
      {/* Main content */}
      <div className="max-w-6xl mx-auto px-5 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#A71E3C" }}>
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-xl font-black tracking-tight">Biblio</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              La bibliothèque numérique de votre établissement. Consultez, empruntez et gérez vos livres en toute simplicité.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>Abidjan, Côte d'Ivoire</span>
              </div>
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span>bibliotheque@etablissement.ci</span>
              </div>
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>+225 07 00 00 00 00</span>
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
        <div className="max-w-6xl mx-auto px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/30 text-xs">© {new Date().getFullYear()} Tous droits réservés - Fait avec <span onClick={() => navigate("https://www.smartlib.tech/")} className="text-secondary font-bold cursor-pointer">SmartLib</span> </p>
        </div>
      </div>
    </footer>
  )
}
