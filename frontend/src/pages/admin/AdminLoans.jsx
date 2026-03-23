import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader } from "@zxing/library"
import {
  BookOpen, RotateCcw, ChevronLeft, ChevronRight,
  QrCode, Barcode, CheckCircle, Search, X, User,
} from "lucide-react"
import Navbar from "../../components/navbar"
import Footer from "../../components/footer"
import { getAllLoans, returnBook, borrowBook, returnByUserAndIsbn, getUserLoans } from "../../api/loan"
import { getBookByIsbn, getBooks } from "../../api/book"
import { getUserById } from "../../api/user"
import toast from "react-hot-toast"

// ── Composants partagés (scanner, cartes) ───────────────────────────
function Scanner({ onResult, onCancel, label }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader()
    let active = true

    codeReader.listVideoInputDevices().then(devices => {
      const back = devices.find(d => /back|rear|environment/i.test(d.label))
      const deviceId = back?.deviceId || null
      return codeReader.decodeFromVideoDevice(deviceId, videoRef.current, (result) => {
        if (result && active) {
          active = false
          codeReader.reset()
          new Audio("/done.mp3").play().catch(() => {})
          onResult(result.getText())
        }
      })
    }).catch(() => { toast.error("Impossible d'accéder à la caméra"); onCancel() })
    return () => { active = false; codeReader.reset() }
  }, [])

  return (
    <div className="space-y-3">
      <p className="text-sm text-center font-medium" style={{ color: "var(--muted)" }}>{label}</p>
      <video ref={videoRef} className="w-full h-52 object-cover rounded-xl bg-black" />
      <button onClick={onCancel} className="btn btn-ghost w-full">Annuler</button>
    </div>
  )
}

function UserCard({ user, onClear }) {
  const initials = user.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "var(--border)", border: "1px solid var(--border-md)" }}>
      <div className="avatar avatar-md">{initials}</div>
      <div className="flex-1">
        <p className="font-bold text-primary text-sm">{user.fullName}</p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>{user.department}{user.year && ` · ${user.year}`}</p>
      </div>
      <button onClick={onClear} style={{ color: "var(--muted)" }} className="hover:text-primary"><X className="w-4 h-4" /></button>
    </div>
  )
}

function BookCard({ book, onClear }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(167,30,60,0.04)", border: "1px solid rgba(167,30,60,0.12)" }}>
      {book.cover
        ? <img src={book.cover} alt={book.title} className="w-10 h-14 object-cover rounded-lg shrink-0" />
        : <div className="w-10 h-14 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "#e2e8f0" }}><BookOpen className="w-4 h-4" style={{ color: "var(--muted)" }} /></div>
      }
      <div className="flex-1">
        <p className="font-bold text-sm text-primary">{book.title}</p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>{Array.isArray(book.author) ? book.author[0] : book.author}</p>
        <span className={`badge mt-1 ${book.availableCopies > 0 ? "badge-green" : "badge-red"}`}>
          {book.availableCopies > 0 ? `${book.availableCopies} dispo` : "Indisponible"}
        </span>
      </div>
      <button onClick={onClear} style={{ color: "var(--muted)" }} className="hover:text-primary"><X className="w-4 h-4" /></button>
    </div>
  )
}

function BookSearch({ onSelect }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const t = setTimeout(() => {
      setSearching(true)
      getBooks({ search: query })
        .then(r => setResults(Array.isArray(r) ? r.slice(0, 5) : []))
        .finally(() => setSearching(false))
    }, 350)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="space-y-2">
      <div className="search-wrap">
        <Search className="search-icon" />
        <input value={query} onChange={e => setQuery(e.target.value)} className="search-input" placeholder="Titre, auteur, ISBN…" />
      </div>
      {searching && <p className="text-xs text-center" style={{ color: "var(--muted)" }}>Recherche…</p>}
      {results.map(b => (
        <button key={b._id} onClick={() => { onSelect(b); setQuery(""); setResults([]) }}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-left card-hover"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {b.cover
            ? <img src={b.cover} alt={b.title} className="w-8 h-11 object-cover rounded-lg shrink-0" />
            : <div className="w-8 h-11 rounded-lg shrink-0" style={{ background: "var(--bg)" }} />}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-primary truncate">{b.title}</p>
            <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{Array.isArray(b.author) ? b.author[0] : b.author}</p>
          </div>
          <span className={`badge ${b.availableCopies > 0 ? "badge-green" : "badge-red"}`}>
            {b.availableCopies > 0 ? "Dispo" : "Indispo"}
          </span>
        </button>
      ))}
    </div>
  )
}

// ── Vue liste des emprunts ───────────────────────────────────────────
const tabs = ["Tous", "En cours", "Retournés", "En retard"]
const PAGE_SIZE = 20

const statusConfig = {
  borrowed: { label: "En cours",  cls: "badge-blue",  tab: "En cours" },
  returned: { label: "Retourné",  cls: "badge-green", tab: "Retournés" },
  late:     { label: "En retard", cls: "badge-red",   tab: "En retard" },
}

function dueDate(borrow) {
  const d = new Date(borrow)
  d.setDate(d.getDate() + 14)
  return d.toLocaleDateString("fr-FR")
}

function LoanList() {
  const [loans, setLoans]       = useState([])
  const [activeTab, setActiveTab] = useState("Tous")
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)

  const load = () => getAllLoans().then(l => setLoans(Array.isArray(l) ? l : []))
  useEffect(() => { load().finally(() => setLoading(false)) }, [])
  useEffect(() => { setPage(1) }, [activeTab])

  const handleReturn = async (id) => {
    const data = await returnBook(id)
    const loan = data.loan || data
    if (loan._id) {
      if (data.fine) toast.success(`Retour enregistré ! Amende: ${data.fine.amount} FCFA (${data.fine.daysLate} j de retard)`, { duration: 6000 })
      else toast.success("Retour enregistré !")
      load()
    } else toast.error(data.message || "Erreur")
  }

  const filtered    = loans.filter(l => activeTab === "Tous" || statusConfig[l.status]?.tab === activeTab)
  const count       = (tab) => tab === "Tous" ? loans.length : loans.filter(l => statusConfig[l.status]?.tab === tab).length
  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto hide-scrollbar pb-1">
        <div className="flex gap-2" style={{ width: "max-content" }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`tab-pill ${activeTab === tab ? "tab-pill-active" : ""}`}>
              {tab} <span className="opacity-60 ml-1">({count(tab)})</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-20" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Aucun emprunt dans cette catégorie</p>
        </div>
      ) : (
        <>
          <div className="row-list">
            {paginated.map(loan => {
              const s = statusConfig[loan.status] || statusConfig.borrowed
              return (
                <div key={loan._id} className="row-item flex-wrap gap-y-2">
                  {/* Couverture + infos */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {loan.book?.cover ? (
                      <img src={loan.book.cover} alt={loan.book.title} className="w-10 h-14 object-cover rounded-lg shrink-0" />
                    ) : (
                      <div className="w-10 h-14 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "var(--bg)" }}>
                        <BookOpen className="w-4 h-4" style={{ color: "var(--muted)" }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-primary truncate">{loan.book?.title || "—"}</p>
                      <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{loan.user?.fullName}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                        {new Date(loan.borrowDate).toLocaleDateString("fr-FR")} → {dueDate(loan.borrowDate)}
                      </p>
                    </div>
                  </div>
                  {/* Badge + action */}
                  <div className="flex items-center gap-3 justify-between w-full sm:w-auto sm:flex-col sm:items-end sm:gap-2">
                    <span className={`badge ${s.cls}`}>{s.label}</span>
                    {loan.status !== "returned" && (
                      <button onClick={() => handleReturn(loan._id)}
                        className="flex items-center gap-1 text-xs font-bold text-secondary hover:underline">
                        <RotateCcw className="w-3 h-3" /> Retourner
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Page {page} / {totalPages} · {filtered.length} résultats
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 disabled:opacity-30 hover:border-primary transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 disabled:opacity-30 hover:border-primary transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Vue gestion QR (emprunt / retour) ───────────────────────────────
function ManageLoans() {
  const [mode, setMode]             = useState("borrow")
  const [step, setStep]             = useState("user")
  const [scanType, setScanType]     = useState(null)
  const [scannedUser, setScannedUser] = useState(null)
  const [scannedBook, setScannedBook] = useState(null)
  const [activeLoans, setActiveLoans] = useState([])
  const [loading, setLoading]       = useState(false)

  const handleUserQr = async (userId) => {
    setScanType(null)
    try {
      const user = await getUserById(userId)
      if (user._id) {
        setScannedUser(user)
        setStep("book")
        if (mode === "return") {
          const loans = await getUserLoans(user._id)
          setActiveLoans(Array.isArray(loans) ? loans.filter(l => l.status !== "returned") : [])
        }
      } else {
        toast.error(user.message || "Utilisateur introuvable")
      }
    } catch { toast.error("Erreur lors de la lecture du QR") }
  }

  const handleBookBarcode = async (isbn) => {
    setScanType(null)
    try {
      const book = await getBookByIsbn(isbn)
      if (book._id) { setScannedBook(book); setStep("confirm") }
      else toast.error("Livre introuvable — fais une recherche manuelle")
    } catch { toast.error("Erreur lors de la lecture du code barre") }
  }

  const reset = () => {
    setStep("user"); setScannedUser(null); setScannedBook(null)
    setActiveLoans([]); setScanType(null)
  }

  const handleBorrow = async () => {
    if (!scannedUser || !scannedBook) return
    setLoading(true)
    try {
      const data = await borrowBook(scannedUser._id, scannedBook._id)
      const loan = data.loan || data
      if (loan._id) { toast.success(`Emprunt enregistré pour ${scannedUser.fullName} !`); reset() }
      else toast.error(data.message || "Erreur")
    } catch { toast.error("Erreur serveur") }
    finally { setLoading(false) }
  }

  const handleReturnByIsbn = async () => {
    if (!scannedUser || !scannedBook) return
    setLoading(true)
    try {
      const data = await returnByUserAndIsbn(scannedUser._id, scannedBook.isbn)
      const returned = data.loan || data
      if (returned._id) {
        if (data.fine) toast.success(`Retour enregistré ! Amende: ${data.fine.amount} FCFA (${data.fine.daysLate} j de retard)`, { duration: 6000 })
        else toast.success("Retour enregistré !")
        reset()
      } else toast.error(data.message || "Erreur")
    } catch { toast.error("Erreur serveur") }
    finally { setLoading(false) }
  }

  const handleReturnFromList = async (loan) => {
    setLoading(true)
    try {
      const data = await returnBook(loan._id)
      const returned = data.loan || data
      if (returned._id) {
        if (data.fine) toast.success(`Retour enregistré ! Amende: ${data.fine.amount} FCFA (${data.fine.daysLate} j de retard)`, { duration: 6000 })
        else toast.success("Retour enregistré !")
        setActiveLoans(prev => prev.filter(l => l._id !== loan._id))
      } else toast.error(data.message || "Erreur")
    } catch { toast.error("Erreur serveur") }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      {/* Toggle emprunt / retour */}
      <div className="toggle-wrap">
        {[{ key: "borrow", label: "Emprunt" }, { key: "return", label: "Retour" }].map(m => (
          <button key={m.key} onClick={() => { setMode(m.key); reset() }}
            className={`toggle-btn ${mode === m.key ? "toggle-btn-active" : ""}`}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Étape 1 : QR lecteur */}
      <div className={`card-p space-y-4`} style={step === "user" ? { borderColor: "rgba(4,8,72,0.18)" } : {}}>
        <div className="flex items-center gap-3">
          {scannedUser ? <div className="step-done"><CheckCircle className="w-4 h-4" /></div>
            : step === "user" ? <div className="step-active">1</div>
            : <div className="step-inactive">1</div>}
          <p className="font-black text-primary">Scan QR du lecteur</p>
        </div>

        {scannedUser ? (
          <UserCard user={scannedUser} onClear={reset} />
        ) : scanType === "qr" ? (
          <Scanner label="Pointe la caméra vers le QR code du lecteur" onResult={handleUserQr} onCancel={() => setScanType(null)} />
        ) : (
          <button onClick={() => setScanType("qr")} className="btn btn-primary w-full">
            <QrCode className="w-5 h-5" /> Scanner le QR code
          </button>
        )}
      </div>

      {/* Étape 2 : ISBN livre */}
      {scannedUser && (
        <div className="card-p space-y-4" style={step === "book" ? { borderColor: "rgba(4,8,72,0.18)" } : {}}>
          <div className="flex items-center gap-3">
            {scannedBook ? <div className="step-done"><CheckCircle className="w-4 h-4" /></div>
              : step === "book" ? <div className="step-active">2</div>
              : <div className="step-inactive">2</div>}
            <p className="font-black text-primary">Scan code barre du livre</p>
          </div>

          {mode === "return" && activeLoans.length > 0 && !scannedBook && (
            <div className="space-y-2">
              <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Emprunts actifs de {scannedUser.fullName}</p>
              {activeLoans.map(loan => (
                <div key={loan._id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--bg)" }}>
                  {loan.book?.cover
                    ? <img src={loan.book.cover} alt={loan.book.title} className="w-9 h-12 object-cover rounded-lg shrink-0" />
                    : <div className="w-9 h-12 rounded-lg shrink-0" style={{ background: "#e2e8f0" }} />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-primary truncate">{loan.book?.title}</p>
                    <span className={`badge ${loan.status === "late" ? "badge-red" : "badge-blue"}`}>
                      {loan.status === "late" ? "En retard" : "En cours"}
                    </span>
                  </div>
                  <button onClick={() => handleReturnFromList(loan)} disabled={loading}
                    className="btn btn-secondary btn-sm">
                    <RotateCcw className="w-3 h-3" /> Retourner
                  </button>
                </div>
              ))}
              <p className="text-xs text-center" style={{ color: "var(--muted)" }}>ou scanne le code barre du livre</p>
            </div>
          )}

          {scannedBook ? (
            <BookCard book={scannedBook} onClear={() => { setScannedBook(null); setStep("book") }} />
          ) : scanType === "isbn" ? (
            <Scanner label="Pointe la caméra vers le code barre du livre" onResult={handleBookBarcode} onCancel={() => setScanType(null)} />
          ) : (
            <div className="space-y-3">
              <button onClick={() => setScanType("isbn")} className="btn btn-secondary w-full">
                <Barcode className="w-5 h-5" /> Scanner le code barre (ISBN)
              </button>
              <p className="text-xs text-center" style={{ color: "var(--muted)" }}>Pas de code barre ? Recherche manuelle ↓</p>
              <BookSearch onSelect={b => { setScannedBook(b); setStep("confirm") }} />
            </div>
          )}
        </div>
      )}

      {/* Étape 3 : Confirmation */}
      {scannedUser && scannedBook && (
        <div className="card-p space-y-5" style={{ borderColor: "#bbf7d0" }}>
          <div className="flex items-center gap-3">
            <div className="step-active">3</div>
            <p className="font-black text-primary">Confirmation</p>
          </div>

          <div className="space-y-3 p-4 rounded-xl" style={{ background: "var(--bg)" }}>
            <div className="flex items-start gap-2 text-sm min-w-0">
              <User className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--muted)" }} />
              <span className="shrink-0" style={{ color: "var(--muted)" }}>Lecteur :</span>
              <span className="font-bold text-primary truncate">{scannedUser.fullName}</span>
            </div>
            <div className="flex items-start gap-2 text-sm min-w-0">
              <BookOpen className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--muted)" }} />
              <span className="shrink-0" style={{ color: "var(--muted)" }}>Livre :</span>
              <span className="font-bold text-primary truncate">{scannedBook.title}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span style={{ color: "var(--muted)" }}>Opération :</span>
              <span className={`badge ${mode === "borrow" ? "badge-blue" : "badge-green"}`}>
                {mode === "borrow" ? "Emprunt" : "Retour"}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={reset} className="btn btn-ghost flex-1">Annuler</button>
            <button
              onClick={mode === "borrow" ? handleBorrow : handleReturnByIsbn}
              disabled={loading}
              className={`btn flex-1 ${mode === "borrow" ? "btn-primary" : ""}`}
              style={mode === "return" ? { background: "#059669", color: "#fff" } : {}}
            >
              {loading
                ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : mode === "borrow" ? "Confirmer l'emprunt" : "Confirmer le retour"
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page principale ──────────────────────────────────────────────────
export default function AdminLoans() {
  const [view, setView] = useState("list")

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <Navbar />

      <div className="w-full px-4 py-8 space-y-6">
        <div>
          <p className="overline mb-1">Admin</p>
          <h1 className="text-xl md:text-3xl font-black text-primary">Emprunts</h1>
        </div>

        {/* Toggle liste / gérer */}
        <div className="toggle-wrap sm:max-w-xs">
          {[
            { key: "list",   label: "Liste" },
            { key: "manage", label: "Gérer (QR)" },
          ].map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`toggle-btn ${view === v.key ? "toggle-btn-active" : ""}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {view === "list" ? <LoanList /> : <ManageLoans />}
      </div>
      <Footer />
    </div>
  )
}