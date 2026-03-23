import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Save, Settings, Star, X, Search } from "lucide-react"
import toast from "react-hot-toast"
import Navbar from "../../components/navbar"
import Footer from "../../components/footer"
import { getSettings, updateSettings } from "../../api/settings"
import { getBooks } from "../../api/book"

export default function AdminSettings() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ maxLoansPerUser: 3, loanDurationDays: 14, emailNotifications: true, featuredBook: null })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [books, setBooks] = useState([])
  const [bookSearch, setBookSearch] = useState("")
  const [showBookPicker, setShowBookPicker] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)

  useEffect(() => {
    Promise.all([
      getSettings(),
      getBooks(),
    ]).then(([data, booksData]) => {
      if (data._id) {
        setForm({
          maxLoansPerUser: data.maxLoansPerUser,
          loanDurationDays: data.loanDurationDays,
          emailNotifications: data.emailNotifications,
          featuredBook: data.featuredBook?._id || null,
        })
        if (data.featuredBook) setSelectedBook(data.featuredBook)
      }
      setBooks(Array.isArray(booksData) ? booksData : [])
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

  const handlePickBook = (book) => {
    setSelectedBook(book)
    setForm(f => ({ ...f, featuredBook: book._id }))
    setShowBookPicker(false)
    setBookSearch("")
  }

  const handleRemoveFeatured = () => {
    setSelectedBook(null)
    setForm(f => ({ ...f, featuredBook: null }))
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

  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
    (Array.isArray(b.author) ? b.author[0] : b.author)?.toLowerCase().includes(bookSearch.toLowerCase())
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <Navbar />
      <div className="w-full px-4 py-8">
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
              <p className="font-bold text-lg mb-2">Amendes</p>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(225,29,72,0.06)", border: "1px solid rgba(225,29,72,0.15)" }}>
                <span className="text-2xl font-black" style={{ color: "#e11d48" }}>500</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#e11d48" }}>FCFA / jour de retard</p>
                  <p className="text-xs text-muted">Tarif fixe — calculé automatiquement au retour du livre</p>
                </div>
              </div>
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

            <hr className="border-surface" />

            {/* ── Coup de cœur ── */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-secondary" />
                <p className="font-bold text-lg">Coup de cœur</p>
              </div>
              <p className="text-muted text-xs mb-4">Le livre mis en avant sur la page d'accueil. Si aucun livre n'est sélectionné, la section est masquée.</p>

              {selectedBook ? (
                <div className="flex items-center gap-4 p-4 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <img
                    src={selectedBook.cover}
                    alt={selectedBook.title}
                    className="w-12 aspect-[2/3] object-cover rounded-lg shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{selectedBook.title}</p>
                    <p className="text-xs text-muted truncate">
                      {Array.isArray(selectedBook.author) ? selectedBook.author[0] : selectedBook.author}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setShowBookPicker(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: "var(--border)", color: "var(--fg)" }}
                    >
                      Changer
                    </button>
                    <button
                      onClick={handleRemoveFeatured}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowBookPicker(true)}
                  className="w-full py-4 rounded-2xl border-2 border-dashed text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
                  style={{ borderColor: "var(--border-md)", color: "var(--muted)" }}
                >
                  + Choisir un livre
                </button>
              )}

              {/* Book picker modal */}
              {showBookPicker && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  style={{ background: "rgba(0,0,0,0.6)" }}
                  onClick={() => { setShowBookPicker(false); setBookSearch("") }}
                >
                  <div
                    className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg rounded-3xl overflow-hidden flex flex-col"
                    style={{ background: "var(--surface)", maxHeight: "80vh" }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center justify-between mb-4">
                        <p className="font-black text-lg">Choisir le coup de cœur</p>
                        <button onClick={() => { setShowBookPicker(false); setBookSearch("") }} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Rechercher un titre ou auteur..."
                          value={bookSearch}
                          onChange={e => setBookSearch(e.target.value)}
                          className="input w-full pl-9"
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {filteredBooks.length === 0 ? (
                        <p className="text-center text-muted py-10 text-sm">Aucun livre trouvé</p>
                      ) : (
                        filteredBooks.map(book => (
                          <button
                            key={book._id}
                            onClick={() => handlePickBook(book)}
                            className="w-full flex items-center gap-4 p-4 transition-colors text-left border-b last:border-0"
                            onMouseEnter={e => e.currentTarget.style.background = "var(--row-hover)"}
                            onMouseLeave={e => e.currentTarget.style.background = ""}
                            style={{ borderColor: "var(--border)" }}
                          >
                            <img
                              src={book.cover}
                              alt={book.title}
                              className="w-10 aspect-[2/3] object-cover rounded-lg shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{book.title}</p>
                              <p className="text-xs text-muted truncate">
                                {Array.isArray(book.author) ? book.author[0] : book.author}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
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
