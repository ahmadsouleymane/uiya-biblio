import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Plus, Trash2, BookOpen, ChevronLeft, ChevronRight, Upload, Tag } from "lucide-react"
import Navbar from "../../components/navbar"
import Footer from "../../components/footer"
import { getBooks, deleteBook } from "../../api/book"
import toast from "react-hot-toast"
import { generateBookLabel } from "../../utils/bookLabel"

const PAGE_SIZE = 24

export default function AdminBooks() {
  const navigate  = useNavigate()
  const [books, setBooks]   = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [page, setPage]     = useState(1)

  const load = (q = "") => getBooks(q ? { search: q } : {}).then(b => setBooks(Array.isArray(b) ? b : []))
  useEffect(() => { load().finally(() => setLoading(false)) }, [])
  useEffect(() => {
    setPage(1)
    const t = setTimeout(() => load(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Supprimer "${title}" ?`)) return
    const data = await deleteBook(id)
    if (data.message?.includes("supprimé")) {
      toast.success("Livre supprimé")
      setBooks(prev => prev.filter(b => b._id !== id))
    } else {
      toast.error(data.message || "Erreur")
    }
  }

  const totalPages = Math.ceil(books.length / PAGE_SIZE)
  const paginated  = books.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="overline mb-1">Admin</p>
            <h1 className="text-xl md:text-3xl font-black text-primary">Livres</h1>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="badge badge-primary">{books.length} titres</span>
            <button onClick={() => navigate("/admin/import")} className="btn btn-ghost flex items-center gap-1 text-sm">
              <Upload className="w-4 h-4" /> Import CSV
            </button>
            <button onClick={() => navigate("/add-book")} className="btn btn-secondary">
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
        </div>

        <div className="search-wrap">
          <Search className="search-icon" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
            placeholder="Rechercher par titre, auteur, ISBN…"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton aspect-[2/3]" />)}
          </div>
        ) : books.length === 0 ? (
          <div className="empty-state">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aucun livre trouvé</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {paginated.map(book => (
                <div key={book._id} className="group relative cursor-pointer" onClick={() => navigate(`/book/${book._id}`)}>
                  <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300">
                    {book.cover ? (
                      <img src={book.cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: "#e2e8f0" }}>
                        <BookOpen className="w-8 h-8" style={{ color: "var(--muted)" }} />
                      </div>
                    )}
                    {/* Desktop hover overlay */}
                    <div className="hidden md:flex absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all rounded-xl items-center justify-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); generateBookLabel(book) }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-10 h-10 rounded-full bg-white/80 backdrop-blur text-primary flex items-center justify-center shadow-lg hover:bg-white"
                        title="Télécharger l'étiquette"
                      >
                        <Tag className="w-4 h-4" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(book._id, book.title) }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="font-semibold text-sm text-primary truncate">{book.title}</p>
                    <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{Array.isArray(book.author) ? book.author[0] : book.author}</p>
                    <span className={`badge ${book.availableCopies > 0 ? "badge-green" : "badge-red"}`}>
                      {book.availableCopies}/{book.copies} dispo
                    </span>
                    {/* Mobile action buttons */}
                    <div className="flex gap-2 pt-1 md:hidden">
                      <button
                        onClick={e => { e.stopPropagation(); generateBookLabel(book) }}
                        className="flex-1 h-9 rounded-lg bg-gray-100 flex items-center justify-center gap-1 text-xs font-semibold text-primary"
                      >
                        <Tag className="w-3.5 h-3.5" /> Étiquette
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(book._id, book.title) }}
                        className="flex-1 h-9 rounded-lg bg-red-50 flex items-center justify-center gap-1 text-xs font-semibold text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  Page {page} / {totalPages} · {books.length} livre{books.length > 1 ? "s" : ""}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 disabled:opacity-30 hover:border-primary transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 disabled:opacity-30 hover:border-primary transition-colors"
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