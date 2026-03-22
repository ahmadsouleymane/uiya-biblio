import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Mail, KeyRound, ShieldCheck } from "lucide-react"
import toast from "react-hot-toast"
import { forgotPassword } from "../api/user"

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!email) { toast.error("Entrez votre email"); return }
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch {
      toast.error("Erreur, réessayez")
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
              Réinitialiser<br />
              <span style={{ color: "#A71E3C" }}>votre accès</span>
            </h1>
            <p className="text-lg xl:text-xl leading-relaxed max-w-sm" style={{ color: "rgba(255,255,255,0.50)" }}>
              Pas de panique — entrez votre email et nous vous enverrons un lien pour créer un nouveau mot de passe.
            </p>

            {/* Étapes */}
            <div className="flex flex-col gap-5 mt-12">
              {[
                { icon: <Mail className="w-5 h-5" />,       step: "01", label: "Entrez votre email" },
                { icon: <ShieldCheck className="w-5 h-5" />, step: "02", label: "Vérifiez votre boîte mail" },
                { icon: <KeyRound className="w-5 h-5" />,    step: "03", label: "Créez un nouveau mot de passe" },
              ].map(({ icon, step, label }) => (
                <div key={step} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.10)" }}>
                    <span style={{ color: "rgba(255,255,255,0.6)" }}>{icon}</span>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{step}</p>
                    <p className="text-sm font-semibold text-white">{label}</p>
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

            {sent ? (
              /* ── État succès ── */
              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{ background: "rgba(34,197,94,0.12)" }}
                >
                  <Mail className="w-10 h-10" style={{ color: "#22c55e" }} />
                </div>
                <h2 className="text-3xl font-black mb-3" style={{ color: "var(--fg)" }}>Email envoyé !</h2>
                <p className="text-base mb-8 leading-relaxed" style={{ color: "var(--muted)" }}>
                  Si cet email est associé à un compte, vous recevrez un lien de réinitialisation sous peu. Pensez à vérifier vos spams.
                </p>
                <button
                  onClick={() => navigate("/connexion")}
                  className="btn btn-primary btn-lg w-full"
                >
                  Retour à la connexion
                </button>
              </div>
            ) : (
              /* ── Formulaire ── */
              <>
                {/* Titre */}
                <div className="mb-10">
                  <h2 className="text-3xl lg:text-4xl font-black mb-2" style={{ color: "var(--fg)" }}>
                    Mot de passe oublié ?
                  </h2>
                  <p className="text-base" style={{ color: "var(--muted)" }}>
                    Entrez votre email pour recevoir un lien de réinitialisation
                  </p>
                </div>

                <div className="space-y-4">
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Bouton */}
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn btn-primary btn-lg w-full"
                    style={{ marginTop: "0.75rem" }}
                  >
                    {loading
                      ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : "Envoyer le lien"}
                  </button>
                </div>

                {/* Séparateur */}
                <div className="flex items-center gap-4 my-8">
                  <div className="flex-1 h-px" style={{ background: "var(--border-md)" }} />
                  <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>OU</span>
                  <div className="flex-1 h-px" style={{ background: "var(--border-md)" }} />
                </div>

                <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
                  Vous vous souvenez ?{" "}
                  <button
                    onClick={() => navigate("/connexion")}
                    className="font-black transition-colors"
                    style={{ color: "#040848" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#A71E3C"}
                    onMouseLeave={e => e.currentTarget.style.color = "#040848"}
                  >
                    Se connecter →
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
