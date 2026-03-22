import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Save, Settings } from "lucide-react"
import toast from "react-hot-toast"
import Navbar from "../../components/navbar"
import Footer from "../../components/footer"
import { getSettings, updateSettings } from "../../api/settings"

export default function AdminSettings() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fineRatePerDay: 50, maxLoansPerUser: 3, loanDurationDays: 14, emailNotifications: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSettings().then(data => {
      if (data._id) setForm({
        fineRatePerDay: data.fineRatePerDay,
        maxLoansPerUser: data.maxLoansPerUser,
        loanDurationDays: data.loanDurationDays,
        emailNotifications: data.emailNotifications,
      })
    }).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings(form)
      toast.success("Paramètres enregistrés")
    } catch {
      toast.error("Erreur")
    } finally {
      setSaving(false)
    }
  }

  const field = (key, label, type = "number", min, max) => (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <input
        className="input w-full"
        type={type}
        min={min}
        max={max}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
      />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate("/admin")} className="w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:bg-surface/80 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6" />
            <h1 className="text-2xl font-black">Paramètres de la bibliothèque</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="card p-6 space-y-5">
            <div>
              <p className="font-bold text-lg mb-4">Emprunts</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field("loanDurationDays", "Durée d'emprunt (jours)", "number", 1, 60)}
                {field("maxLoansPerUser", "Emprunts simultanés max", "number", 1, 10)}
              </div>
            </div>

            <hr className="border-surface" />

            <div>
              <p className="font-bold text-lg mb-4">Amendes</p>
              {field("fineRatePerDay", "Tarif par jour de retard (FCFA)", "number", 0, 100000)}
            </div>

            <hr className="border-surface" />

            <div>
              <p className="font-bold text-lg mb-4">Notifications email</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm(f => ({ ...f, emailNotifications: !f.emailNotifications }))}
                  className={`w-14 h-7 rounded-full transition-colors flex items-center px-1 cursor-pointer ${form.emailNotifications ? "bg-primary" : "bg-gray-300"}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${form.emailNotifications ? "translate-x-7" : ""}`} />
                </div>
                <span className="text-sm">{form.emailNotifications ? "Activées" : "Désactivées"}</span>
              </label>
              <p className="text-muted text-xs mt-2">Rappels J-2, alertes retard, disponibilité réservations.</p>
            </div>

            <button onClick={handleSave} disabled={saving} className="btn btn-primary w-full flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Enregistrement..." : "Enregistrer les paramètres"}
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}