import { useNavigate } from "react-router-dom"
import logoUrl from "../assets/logo.svg"
import { ArrowLeft, BookOpen, Users, Clock, Eye, EyeOff, User, Mail, Phone, GraduationCap } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"
import { addUser } from "../api/user"
import { useUser } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
const departments = [
  "Informatique option Génie Logiciel", "Droit", "Anglais",
  "Sciences Économiques et de Gestion", "Communication",
]
const years = ["L1", "L2", "L3", "M1", "M2"]

export default function SignUp() {
  const navigate = useNavigate()
  const { setUser } = useUser()
  const { theme } = useTheme()
  const dark = theme === "dark"
  const [form, setForm] = useState({ fullName: "", department: "", year: "", email: "", phone: "", password: "", confirmPassword: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSignup = async () => {
    if (loading) return
    const { fullName, department, year, email, phone, password, confirmPassword } = form
    if (!fullName || !department || !year || !email || !phone || !password || !confirmPassword) {
      toast.error("Remplis tous les champs"); return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Email invalide"); return }
    if (password.length < 6) { toast.error("Mot de passe : 6 caractères minimum"); return }
    if (password !== confirmPassword) { toast.error("Les mots de passe ne correspondent pas"); return }
    setLoading(true)
    try {
      const data = await addUser({ fullName, department, year, email, phone, password })
      if (data._id) {
        setUser(data)
        toast.success("Compte créé avec succès !")
        navigate("/")
      } else {
        toast.error(data.message || "Erreur lors de la création")
      }
    } catch {
      toast.error("Erreur de connexion au serveur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>

      {/* ── Panneau gauche (branding) — desktop ── */}
      <div
        className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col relative overflow-hidden"
        style={{ background: dark ? "linear-gradient(160deg, #1c0a0e 0%, #2e1018 50%, #3a1220 100%)" : "linear-gradient(160deg, #040848 0%, #0d1370 50%, #1a1f8a 100%)" }}
      >
        {/* Cercles décoratifs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10" style={{ background: "#A71E3C" }} />
        <div className="absolute top-1/3 -right-24 w-64 h-64 rounded-full opacity-8" style={{ background: "#ffffff" }} />
        <div className="absolute -bottom-20 left-1/4 w-72 h-72 rounded-full opacity-10" style={{ background: "#A71E3C" }} />

        {/* Contenu */}
        <div className="relative z-10 flex flex-col h-full px-14 py-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Logo" className="h-10" />
          </div>

          {/* Texte principal */}
          <div className="flex-1 flex flex-col justify-center">
            <span className="text-xs font-black uppercase tracking-[0.2em] mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>
              Bibliothèque UIYA
            </span>
            <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.08] mb-6">
              Rejoignez<br />
              <span style={{ color: "#A71E3C" }}>la communauté</span>
            </h1>
            <p className="text-lg xl:text-xl leading-relaxed max-w-sm" style={{ color: "rgba(255,255,255,0.50)" }}>
              Créez votre compte étudiant pour accéder au catalogue, emprunter des livres et suivre vos lectures.
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
          <img src={logoUrl} alt="Logo" className="lg:hidden h-8" />
          <div className="hidden lg:block w-16" />
        </div>

        {/* Formulaire centré */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-16 xl:px-24 py-8">
          <div className="w-full max-w-md">

            {/* Titre */}
            <div className="mb-8">
              <h2 className="text-3xl lg:text-4xl font-black mb-2" style={{ color: "var(--fg)" }}>
                Inscription
              </h2>
              <p className="text-base" style={{ color: "var(--muted)" }}>
                Créez votre espace personnel en quelques secondes
              </p>
            </div>

            {/* Champs */}
            <div className="space-y-4">
              {/* Nom complet */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                  Nom & prénom
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--muted)" }} />
                  <input
                    className="input"
                    style={{ paddingLeft: "2.75rem" }}
                    type="text"
                    placeholder="Fatima Zahra Diallo"
                    onChange={set("fullName")}
                    autoFocus
                  />
                </div>
              </div>

              {/* Département + Année */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                    Département
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--muted)" }} />
                    <select
                      value={form.department}
                      onChange={set("department")}
                      className="input"
                      style={{ paddingLeft: "2.75rem", WebkitAppearance: "none" }}
                    >
                      <option value="" disabled>Choisir</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                    Année
                  </label>
                  <select
                    value={form.year}
                    onChange={set("year")}
                    className="input"
                    style={{ WebkitAppearance: "none" }}
                  >
                    <option value="" disabled>Année</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--muted)" }} />
                  <input
                    className="input"
                    style={{ paddingLeft: "2.75rem" }}
                    type="email"
                    placeholder="exemple@uiya.edu"
                    onChange={set("email")}
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--muted)" }} />
                  <input
                    className="input"
                    style={{ paddingLeft: "2.75rem" }}
                    type="number"
                    placeholder="0X XX XX XX XX"
                    onChange={set("phone")}
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      className="input"
                      style={{ paddingRight: "3rem" }}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      onChange={set("password")}
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
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                    Confirmer
                  </label>
                  <div className="relative">
                    <input
                      className="input"
                      style={{ paddingRight: "3rem" }}
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      onChange={set("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--muted)" }}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bouton */}
              <button
                onClick={handleSignup}
                disabled={loading}
                className="btn btn-primary btn-lg w-full"
                style={{ marginTop: "0.25rem" }}
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : "Créer mon compte"}
              </button>
            </div>

            {/* Séparateur */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px" style={{ background: "var(--border-md)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>OU</span>
              <div className="flex-1 h-px" style={{ background: "var(--border-md)" }} />
            </div>

            {/* Connexion */}
            <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
              Déjà un compte ?{" "}
              <button
                onClick={() => navigate("/connexion")}
                className="font-black transition-colors"
                style={{ color: dark ? "#d42040" : "#040848" }}
                onMouseEnter={e => e.currentTarget.style.color = "#A71E3C"}
                onMouseLeave={e => e.currentTarget.style.color = dark ? "#d42040" : "#040848"}
              >
                Se connecter →
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
