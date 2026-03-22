import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, CheckCircle, Trash2, Plus } from "lucide-react"
import toast from "react-hot-toast"
import Navbar from "../../components/navbar"
import Footer from "../../components/footer"
import { getAllFines, payFine, deleteFine, createManualFine } from "../../api/fine"
import { getAllUsers } from "../../api/user"

export default function AdminFines() {
  const navigate = useNavigate()
  const [fines, setFines] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ userId: "", amount: "", reason: "" })

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterStatus) params.status = filterStatus
      const data = await getAllFines(params)
      setFines(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filterStatus])

  useEffect(() => {
    if (showCreate && users.length === 0) {
      getAllUsers().then(data => setUsers(Array.isArray(data) ? data : []))
    }
  }, [showCreate])

  const handlePay = async (id) => {
    try {
      await payFine(id)
      toast.success("Amende marquée comme payée")
      load()
    } catch {
      toast.error("Erreur")
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette amende ?")) return
    try {
      await deleteFine(id)
      toast.success("Amende supprimée")
      load()
    } catch {
      toast.error("Erreur")
    }
  }

  const handleCreate = async () => {
    if (!form.userId || !form.amount) { toast.error("Utilisateur et montant requis"); return }
    try {
      await createManualFine({ userId: form.userId, amount: Number(form.amount), reason: form.reason })
      toast.success("Amende créée")
      setShowCreate(false)
      setForm({ userId: "", amount: "", reason: "" })
      load()
    } catch {
      toast.error("Erreur")
    }
  }

  const pending = fines.filter(f => f.status === "pending")
  const paid = fines.filter(f => f.status === "paid")
  const totalPending = pending.reduce((s, f) => s + f.amount, 0)

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate("/admin")} className="w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:bg-surface/80 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black">Gestion des amendes</h1>
            <p className="text-muted text-sm">{pending.length} amende(s) en attente — {totalPending} FCFA</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="ml-auto btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouvelle amende
          </button>
        </div>

        {/* Création manuelle */}
        {showCreate && (
          <div className="card p-5 mb-6 space-y-3">
            <p className="font-bold">Créer une amende manuelle</p>
            <select className="input w-full" value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}>
              <option value="">Sélectionner un utilisateur</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.fullName} — {u.department}</option>)}
            </select>
            <input className="input w-full" type="number" placeholder="Montant (DA)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            <input className="input w-full" placeholder="Raison (optionnel)" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
            <div className="flex gap-2">
              <button onClick={handleCreate} className="btn btn-primary">Créer</button>
              <button onClick={() => setShowCreate(false)} className="btn btn-ghost">Annuler</button>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="flex gap-2 mb-6">
          {["", "pending", "paid"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`btn btn-sm ${filterStatus === s ? "btn-primary" : "btn-ghost"}`}>
              {s === "" ? "Toutes" : s === "pending" ? "En attente" : "Payées"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : fines.length === 0 ? (
          <div className="text-center text-muted py-16">Aucune amende</div>
        ) : (
          <div className="space-y-3">
            {fines.map(fine => (
              <div key={fine._id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${fine.status === "pending" ? "bg-red-400" : "bg-green-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{fine.user?.fullName || "—"}</p>
                    <p className="text-muted text-sm truncate">{fine.reason || "Amende"} — {fine.daysLate ? `${fine.daysLate} jour(s) de retard` : ""}</p>
                    {fine.status === "paid" && fine.paidAt && (
                      <p className="text-xs text-muted">Payée le {new Date(fine.paidAt).toLocaleDateString("fr-FR")}{fine.paidBy ? ` par ${fine.paidBy.fullName}` : ""}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <p className={`font-black text-lg ${fine.status === "pending" ? "text-red-400" : "text-green-400"}`}>{fine.amount} FCFA</p>
                    <p className="text-xs text-muted">{new Date(fine.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <div className="flex gap-2">
                    {fine.status === "pending" && (
                      <button onClick={() => handlePay(fine._id)} className="w-10 h-10 rounded-full bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center text-green-400 transition-colors" title="Marquer comme payée">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(fine._id)} className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}