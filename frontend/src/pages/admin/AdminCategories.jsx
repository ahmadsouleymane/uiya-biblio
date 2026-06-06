import { useEffect, useState } from "react"
import { Search, Plus, Pencil, Trash2, FolderOpen, X, Check, Loader2 } from "lucide-react"
import Navbar from "../../components/navbar"
import Footer from "../../components/footer"
import { getCategories, addCategory, updateCategory, deleteCategory } from "../../api/category"
import toast from "react-hot-toast"

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  // Ajout
  const [newName, setNewName] = useState("")
  const [adding, setAdding] = useState(false)

  // Edition
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState("")
  const [saving, setSaving] = useState(false)

  const load = () => getCategories().then(data => setCategories(Array.isArray(data) ? data : []))

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  const filtered = categories.filter(c =>
    (c.name || "").toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async () => {
    if (adding) return
    if (!newName.trim()) return
    setAdding(true)
    try {
      const data = await addCategory(newName.trim())
      if (data._id) {
        toast.success("Catégorie ajoutée")
        setNewName("")
        load()
      } else {
        toast.error(data.message || "Erreur")
      }
    } catch {
      toast.error("Erreur serveur")
    } finally {
      setAdding(false)
    }
  }

  const handleUpdate = async (id) => {
    if (saving) return
    if (!editName.trim()) return
    setSaving(true)
    try {
      const data = await updateCategory(id, editName.trim())
      if (data._id) {
        toast.success("Catégorie modifiée")
        setEditId(null)
        load()
      } else {
        toast.error(data.message || "Erreur")
      }
    } catch {
      toast.error("Erreur serveur")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer "${name}" ?`)) return
    try {
      const data = await deleteCategory(id)
      if (data.message?.includes("supprimée")) {
        toast.success("Catégorie supprimée")
        setCategories(prev => prev.filter(c => c._id !== id))
      } else {
        toast.error(data.message || "Erreur")
      }
    } catch {
      toast.error("Erreur serveur")
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <Navbar />

      <div className="w-full px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="overline mb-1">Admin</p>
            <h1 className="text-xl md:text-3xl font-black text-primary">Catégories</h1>
          </div>
          <span className="badge badge-primary shrink-0 mt-1">{categories.length} catégories</span>
        </div>

        {/* Ajout */}
        <div className="card-p">
          <p className="text-sm font-bold mb-3" style={{ color: "var(--fg)" }}>Nouvelle catégorie</p>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder="Nom de la catégorie"
              className="input flex-1"
            />
            <button onClick={handleAdd} disabled={adding || !newName.trim()} className="btn btn-primary flex items-center gap-1.5 px-4">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Ajouter
            </button>
          </div>
        </div>

        {/* Recherche */}
        <div className="search-wrap">
          <Search className="search-icon" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
            placeholder="Rechercher une catégorie…"
          />
        </div>

        {/* Liste */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">{search ? "Aucune catégorie trouvée" : "Aucune catégorie"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(cat => (
              <div
                key={cat._id}
                className="card-p flex items-center gap-3"
              >
                {editId === cat._id ? (
                  <>
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleUpdate(cat._id)}
                      className="input flex-1"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdate(cat._id)}
                      disabled={saving || !editName.trim()}
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "#059669", color: "#fff" }}
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "var(--surface-alt)", color: "var(--muted)" }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <FolderOpen className="w-5 h-5 shrink-0" style={{ color: "var(--muted)" }} />
                    <p className="flex-1 font-semibold text-sm text-primary truncate">{cat.name}</p>
                    <button
                      onClick={() => { setEditId(cat._id); setEditName(cat.name) }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
                      style={{ background: "rgba(4,8,72,0.08)", color: "#040848" }}
                      title="Modifier"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat._id, cat.name)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
                      style={{ background: "rgba(225,29,72,0.08)", color: "#e11d48" }}
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
