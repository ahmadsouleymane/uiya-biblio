import { useNavigate } from "react-router-dom"
import { BookOpen, Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: "var(--bg)" }}>

      {/* Icône */}
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8"
        style={{ background: "rgba(4,8,72,0.06)" }}
      >
        <BookOpen className="w-12 h-12" style={{ color: "var(--fg)", opacity: 0.3 }} />
      </div>

      {/* 404 */}
      <p
        className="text-8xl lg:text-9xl font-black mb-4 leading-none"
        style={{ color: "var(--fg)", opacity: 0.08, letterSpacing: "-0.04em" }}
      >
        404
      </p>

      {/* Texte */}
      <h1 className="text-2xl lg:text-3xl font-black mb-3" style={{ color: "var(--fg)", marginTop: "-1.5rem" }}>
        Page introuvable
      </h1>
      <p className="text-base max-w-sm leading-relaxed mb-10" style={{ color: "var(--muted)" }}>
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>

      {/* Boutons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost btn-lg flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <button
          onClick={() => navigate("/")}
          className="btn btn-primary btn-lg flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          Accueil
        </button>
      </div>
    </div>
  )
}
