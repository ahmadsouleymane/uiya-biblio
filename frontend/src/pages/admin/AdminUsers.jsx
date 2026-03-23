import { useEffect, useState } from "react"
import { Search, Users, Trash2, ChevronLeft, ChevronRight, CreditCard, Download } from "lucide-react"
import Navbar from "../../components/navbar"
import Footer from "../../components/footer"
import { getAllUsers, updateUserRole, deleteUser } from "../../api/user"
import { downloadCard, downloadAllCards } from "../../utils/memberCard"
import { useTheme } from "../../contexts/ThemeContext"
import toast from "react-hot-toast"

const roleConfig = {
  student:  { label: "Étudiant", cls: "badge-blue" },
  employee: { label: "Employé",  cls: "badge-purple" },
  admin:    { label: "Admin",    cls: "badge-red" },
}

const PAGE_SIZE = 25

export default function AdminUsers() {
  const { theme } = useTheme()
  const dark = theme === "dark"
  const [users, setUsers]   = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [page, setPage]     = useState(1)

  const load = () => getAllUsers().then(u => setUsers(Array.isArray(u) ? u : []))
  useEffect(() => { load().finally(() => setLoading(false)) }, [])
  useEffect(() => { setPage(1) }, [search])

  const handleDelete = async (id) => {
    const user = users.find(u => u._id === id)
    if (!window.confirm(`Supprimer définitivement le compte de "${user?.fullName}" ?`)) return
    const data = await deleteUser(id)
    if (data.message?.includes("supprimé")) {
      toast.success("Compte supprimé")
      setUsers(prev => prev.filter(u => u._id !== id))
    } else {
      toast.error(data.message || "Erreur")
    }
  }

  const handleRoleChange = async (id, role, currentRole) => {
    const user = users.find(u => u._id === id)
    const roleLabelMap = { student: "Étudiant", employee: "Employé", admin: "Admin" }
    if (!window.confirm(`Changer le rôle de ${user?.fullName} de "${roleLabelMap[currentRole]}" à "${roleLabelMap[role]}" ?`)) return
    const data = await updateUserRole(id, role)
    if (data._id) {
      toast.success("Rôle mis à jour")
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role } : u))
    } else toast.error(data.message || "Erreur")
  }

  const filtered = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <Navbar />

      <div className="w-full px-4 py-8 space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="overline mb-1">Admin</p>
            <h1 className="text-xl md:text-3xl font-black text-primary">Utilisateurs</h1>
          </div>
          <div className="flex items-center gap-2 mt-1 shrink-0">
            <span className="badge badge-primary hidden sm:inline-flex">{users.length} comptes</span>
            <button
              onClick={async () => {
                const withQR = users.filter(u => u.qrCode)
                if (withQR.length === 0) { toast.error("Aucun QR code disponible"); return }
                toast.success(`Génération de ${withQR.length} cartes…`)
                await downloadAllCards(withQR)
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
              style={{ background: dark ? "#d42040" : "#040848", color: "#fff" }}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tout télécharger</span>
              <span className="sm:hidden">Cartes</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="search-wrap">
          <Search className="search-icon" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
            placeholder="Rechercher par nom, email ou téléphone…"
          />
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="skeleton h-20" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <>
            <div className="row-list">
              {paginated.map(u => {
                const initials = u.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                const r = roleConfig[u.role] || roleConfig.student
                return (
                  <div key={u._id} className="row-item flex-wrap gap-y-2">
                    {/* Info utilisateur */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="avatar avatar-lg shrink-0">{initials}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-primary truncate">{u.fullName}</p>
                        <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{u.email}</p>
                        <p className="text-xs truncate" style={{ color: "#cbd5e1" }}>{u.phone}{u.department && ` · ${u.department}`}{u.year && ` · ${u.year}`}</p>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 ml-auto" style={{ paddingLeft: "0" }}>
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u._id, e.target.value, u.role)}
                        className={`badge ${r.cls} cursor-pointer outline-none border-0`}
                      >
                        <option value="student">Étudiant</option>
                        <option value="employee">Employé</option>
                        <option value="admin">Admin</option>
                      </select>
                      {u.qrCode && (
                        <button
                          onClick={() => downloadCard(u)}
                          className="w-9 h-9 rounded-xl hidden sm:flex items-center justify-center text-gray-400 hover:text-primary hover:bg-blue-50 transition-colors"
                          title="Télécharger la carte membre"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(u._id)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Supprimer l'utilisateur"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  Page {page} / {totalPages} · {filtered.length} utilisateur{filtered.length > 1 ? "s" : ""}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-200 disabled:opacity-30 hover:border-primary transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-200 disabled:opacity-30 hover:border-primary transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}