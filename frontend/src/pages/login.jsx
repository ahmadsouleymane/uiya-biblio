import { useNavigate } from "react-router-dom"
import { ArrowLeft, BookOpen, Users, Clock, Phone, Lock, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"
import { login } from "../api/user"
import { useUser } from "../contexts/AuthContext"

export default function Login() {
  const navigate = useNavigate()
  const { setUser } = useUser()
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!phone || !password) { toast.error("Remplis tous les champs"); return }
    setLoading(true)
    try {
      const data = await login(phone, password)
      if (data._id) {
        setUser(data)
        toast.success("Bienvenue " + data.fullName.split(" ")[0])
        if (data.role === "admin") navigate("/admin")
        else if (data.role === "employee") navigate("/employe")
        else navigate("/")
      } else {
        toast.error(data.message || "Identifiants incorrects")
      }
    } catch {
      toast.error("Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>

      {/* ── Panneau gauche (branding) — desktop ── */}
      <div
        className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #040848 0%, #0d1370 50%, #1a1f8a 100%)" }}
      >
        {/* Cercles décoratifs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10" style={{ background: "#A71E3C" }} />
        <div className="absolute top-1/3 -right-24 w-64 h-64 rounded-full opacity-8" style={{ background: "#ffffff" }} />
        <div className="absolute -bottom-20 left-1/4 w-72 h-72 rounded-full opacity-10" style={{ background: "#A71E3C" }} />

        {/* Contenu */}
        <div className="relative z-10 flex flex-col h-full px-14 py-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/src/assets/logo.svg" alt="Logo" className="h-10" />
          </div>

          {/* Texte principal */}
          <div className="flex-1 flex flex-col justify-center">
            <span className="text-xs font-black uppercase tracking-[0.2em] mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>
              Bibliothèque UIYA
            </span>
            <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.08] mb-6">
              Bienvenue<br />
              <span style={{ color: "#A71E3C" }}>de retour</span>
            </h1>
            <p className="text-lg xl:text-xl leading-relaxed max-w-sm" style={{ color: "rgba(255,255,255,0.50)" }}>
              Accédez à votre espace personnel, gérez vos emprunts et explorez le catalogue.
            </p>

            {/* Stats */}
            <div className="flex items-center gap-8 mt-12">
              {[
                { icon: <BookOpen className="w-5 h-5" />, value: "10K+",  label: "Livres" },
                { icon: <Users    className="w-5 h-5" />, value: "500+",  label: "Membres" },
                { icon: <Clock    className="w-5 h-5" />, value: "24/7",  label: "Accès" },
              ].map(({ icon, value, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.10)" }}>
                    <span style={{ color: "rgba(255,255,255,0.6)" }}>{icon}</span>
                  </div>
                  <div>
                    <p className="text-xl font-black text-white leading-none">{value}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bas de page */}
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
            © {new Date().getFullYear()} Bibliothèque UIYA. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* ── Panneau droit (formulaire) ── */}
      <div className="flex-1 flex flex-col">
        {/* Bouton retour */}
        <div className="flex items-center justify-between px-6 lg:px-10 py-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{ color: "var(--muted)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--fg)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          {/* Logo mobile uniquement */}
          <img src="/src/assets/logo.svg" alt="Logo" className="lg:hidden h-8" />
          <div className="hidden lg:block w-16" />
        </div>

        {/* Formulaire centré */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-16 xl:px-24 pb-12">
          <div className="w-full max-w-md">

            {/* Titre */}
            <div className="mb-10">
              <h2 className="text-3xl lg:text-4xl font-black mb-2" style={{ color: "var(--fg)" }}>
                Connexion
              </h2>
              <p className="text-base" style={{ color: "var(--muted)" }}>
                Entrez vos identifiants pour accéder à votre espace
              </p>
            </div>

            {/* Champs */}
            <div className="space-y-4">
              {/* Téléphone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                  Numéro de téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--muted)" }} />
                  <input
                    className="input"
                    style={{ paddingLeft: "2.75rem" }}
                    type="number"
                    placeholder="0X XX XX XX XX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--muted)" }} />
                  <input
                    className="input"
                    style={{ paddingLeft: "2.75rem", paddingRight: "3rem" }}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--muted)" }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => navigate("/mot-de-passe-oublie")}
                    className="text-xs font-semibold transition-colors"
                    style={{ color: "#A71E3C" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              </div>

              {/* Bouton connexion */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="btn btn-primary btn-lg w-full mt-2"
                style={{ marginTop: "0.75rem" }}
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : "Se connecter"}
              </button>
            </div>

            {/* Séparateur */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px" style={{ background: "var(--border-md)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>OU</span>
              <div className="flex-1 h-px" style={{ background: "var(--border-md)" }} />
            </div>

            {/* Inscription */}
            <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
              Pas encore de compte ?{" "}
              <button
                onClick={() => navigate("/inscription")}
                className="font-black transition-colors"
                style={{ color: "#040848" }}
                onMouseEnter={e => e.currentTarget.style.color = "#A71E3C"}
                onMouseLeave={e => e.currentTarget.style.color = "#040848"}
              >
                S'inscrire gratuitement →
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
