import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Star, BookOpen, Calendar, Globe, Hash, Building2, ChevronRight, Heart, MapPin, Wrench, Link2, Clock, BookMarked, Pencil, FileText } from "lucide-react"
import { useState, useEffect, lazy, Suspense } from "react"
import { getBookById, getBooks } from "../api/book"
import { borrowBook } from "../api/loan"
import { getBookReviews, upsertReview, deleteReview } from "../api/review"
import { addFavorite, removeFavorite } from "../api/user"
import { getSettings } from "../api/settings"
import { useUser } from "../contexts/AuthContext"
import Navbar from "../components/navbar"
import Footer from "../components/footer"
import { useTheme } from "../contexts/ThemeContext"
import toast from "react-hot-toast"

const PdfViewer = lazy(() => import("../components/PdfViewer"))

function StarRating({ rating = 0, interactive = false, onRate }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 transition-colors ${interactive ? "cursor-pointer" : ""} ${
            i <= (interactive ? (hovered || rating) : Math.round(rating))
              ? "fill-secondary text-secondary"
              : "text-[var(--border-md)]"
          }`}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onRate && onRate(i)}
        />
      ))}
    </div>
  )
}

const CONDITION_LABEL = { neuf: "Neuf", bon: "Bon état", usé: "Usé", endommagé: "Endommagé" }
const CONDITION_BADGE = { neuf: "badge badge-green", bon: "badge badge-blue", usé: "badge badge-yellow", endommagé: "badge badge-red" }

export default function BookPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const { theme } = useTheme()
  const dark = theme === "dark"
  const [book, setBook] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [borrowing, setBorrowing] = useState(false)
  const [reviews, setReviews] = useState([])
  const [reviewAvg, setReviewAvg] = useState(0)
  const [myRating, setMyRating] = useState(0)
  const [myComment, setMyComment] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)
  const [loanDays, setLoanDays] = useState(14)
  const [showPdf, setShowPdf] = useState(false)

  useEffect(() => {
    // Charger les paramètres pour la durée d'emprunt
    getSettings()
      .then(d => { if (d.loanDurationDays) setLoanDays(d.loanDurationDays) }).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    getBookById(id)
      .then(data => {
        if (data._id) {
          setBook(data)
          return getBooks({ category: data.category })
        }
      })
      .then(rel => { if (rel) setRelated((Array.isArray(rel) ? rel : rel.books || []).filter(b => b._id !== id).slice(0, 6)) })
      .catch(() => toast.error("Livre introuvable"))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    getBookReviews(id).then(data => {
      if (data.reviews) {
        setReviews(data.reviews)
        setReviewAvg(data.average)
        if (user) {
          const mine = data.reviews.find(r => r.user?._id === user._id || r.user === user._id)
          if (mine) { setMyRating(mine.rating); setMyComment(mine.comment || "") }
        }
      }
    }).catch(() => {})
  }, [id, user])

  useEffect(() => {
    if (user) {
      setLiked(user.favorites?.some(f => (f._id || f) === id) || false)
    }
  }, [id, user])

  const handleBorrow = async () => {
    if (!user) { toast.error("Connecte-toi pour emprunter"); navigate("/connexion"); return }
    if (user.role === "student") {
      toast("Rendez-vous à la bibliothèque pour emprunter ce livre. Un employé s'occupera de vous.", { icon: "📚", duration: 5000 })
      return
    }
    setBorrowing(true)
    try {
      const data = await borrowBook(user._id, book._id)
      if (data.loan || data._id) toast.success("Emprunt enregistré !")
      else toast.error(data.message || "Erreur lors de l'emprunt")
    } catch {
      toast.error("Erreur serveur")
    } finally {
      setBorrowing(false)
    }
  }

  const handleLike = async () => {
    if (!user) { toast.error("Connecte-toi pour ajouter aux favoris"); navigate("/connexion"); return }
    try {
      if (liked) { await removeFavorite(id); setLiked(false); toast.success("Retiré des favoris") }
      else { await addFavorite(id); setLiked(true); toast.success("Ajouté aux favoris !") }
    } catch { toast.error("Erreur") }
  }

  const handleSubmitReview = async () => {
    if (!user) { toast.error("Connecte-toi pour laisser un avis"); return }
    if (!myRating) { toast.error("Sélectionne une note"); return }
    setSubmittingReview(true)
    try {
      const data = await upsertReview({ bookId: id, rating: myRating, comment: myComment })
      if (data._id) {
        toast.success("Avis enregistré !")
        getBookReviews(id).then(d => { if (d.reviews) { setReviews(d.reviews); setReviewAvg(d.average) } })
      } else toast.error(data.message || "Erreur")
    } catch { toast.error("Erreur") }
    setSubmittingReview(false)
  }

  const handleDeleteReview = async (reviewId) => {
    if (!confirm("Supprimer votre avis ?")) return
    try {
      await deleteReview(reviewId)
      toast.success("Avis supprimé")
      getBookReviews(id).then(d => { if (d.reviews) { setReviews(d.reviews); setReviewAvg(d.average); setMyRating(0); setMyComment("") } })
    } catch { toast.error("Erreur") }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <Navbar />
      <div className="h-[50vh] skeleton" />
      <div className="w-full px-4 mt-4 space-y-4">
        <div className="h-10 skeleton rounded-2xl w-2/3" />
        <div className="h-6 skeleton rounded-2xl w-1/3" />
        <div className="h-32 skeleton rounded-2xl" />
      </div>
    </div>
  )

  if (!book) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Navbar />
      <BookOpen className="w-16 h-16 text-gray-300" />
      <p className="text-gray-400 text-lg font-semibold">Livre introuvable</p>
      <button onClick={() => navigate(-1)} className="text-secondary font-bold">Retour</button>
    </div>
  )

  const availabilityPct = Math.round((book.availableCopies / book.copies) * 100)
  const myReview = reviews.find(r => r.user?._id === user?._id)

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: dark ? "#100c0c" : "#040848" }}>
        {book.cover && (
          <img src={book.cover} alt="" className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-35 pointer-events-none" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/55 via-primary/45 to-primary/85" />

        {/* Top bar */}
        <div className="relative z-20 flex items-center justify-between px-4 pt-6 w-full">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <p className="text-white font-semibold text-sm uppercase tracking-widest">Détail du livre</p>
          <div className="flex items-center gap-2">
            {user && (user.role === "admin" || user.role === "employee") && (
              <button onClick={() => navigate(`/edit-book/${id}`)} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center">
                <Pencil className="w-5 h-5" />
              </button>
            )}
            <button onClick={handleLike} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center">
              <Heart className={`w-5 h-5 ${liked ? "fill-secondary text-secondary" : ""}`} />
            </button>
          </div>
        </div>

        {/* Cover + info */}
        <div className="relative z-20 w-full px-4 pt-7 pb-12 flex flex-col items-center gap-5 md:flex-row md:items-end md:gap-10 md:pb-14 md:px-8">
          <div className="shrink-0 w-36 md:w-48 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
            <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
          </div>
          <div className="text-white text-center md:text-left space-y-2 md:pb-2">
            <span className="inline-block bg-secondary/80 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
              {book.category}
            </span>
            <h1 className="text-2xl md:text-4xl font-black leading-tight">{book.title}</h1>
            <p className="text-white/70 text-base">{Array.isArray(book.author) ? book.author.join(", ") : book.author}</p>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <StarRating rating={reviewAvg} />
              <span className="text-white/50 text-sm">({reviews.length} avis)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="w-full px-4">
        <div className="card rounded-3xl shadow-xl -mt-6 relative z-30 grid grid-cols-3 divide-x overflow-hidden" style={{ borderColor: "var(--border)" }}>
          {[
            { icon: <BookOpen className="w-5 h-5" />, value: book.pages, label: "Pages" },
            { icon: <Calendar className="w-5 h-5" />, value: book.year, label: "Année" },
            { icon: <Globe className="w-5 h-5" />, value: "FR", label: "Langue" },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center py-5 gap-1">
              <div className="text-secondary">{s.icon}</div>
              <p className="text-xl font-black text-primary">{s.value}</p>
              <p className="text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content — 2 colonnes sur desktop */}
      <div className="w-full px-4 mt-6 pb-40 lg:pb-28 lg:grid lg:grid-cols-3 lg:gap-8">

        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-8">

          {/* Badges: condition + location */}
          {(book.condition || book.location) && (
            <div className="flex gap-2 flex-wrap">
              {book.condition && (
                <span className={`${CONDITION_BADGE[book.condition] || "badge badge-gray"} flex items-center gap-1`}>
                  <Wrench className="w-3 h-3" /> {CONDITION_LABEL[book.condition] || book.condition}
                </span>
              )}
              {book.location && (
                <span className="badge badge-gray flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {book.location}
                </span>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">À propos</p>
            <h2 className="text-2xl font-black text-primary mb-4">Description</h2>
            <p className="leading-relaxed" style={{ color: "var(--muted)" }}>{book.description || "Aucune description disponible pour ce livre."}</p>
          </div>

          {/* Ressource numérique */}
          {book.digitalUrl && (
            <div className="rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4" style={{ background: "rgba(96,165,250,0.10)", border: "1px solid rgba(96,165,250,0.18)" }}>
              <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto sm:flex-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(96,165,250,0.15)" }}>
                  <Link2 className="w-5 h-5" style={{ color: "#60a5fa" }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>Ressource numérique</p>
                  <p className="text-xs truncate" style={{ color: "#60a5fa" }}>{book.digitalUrl}</p>
                </div>
              </div>
              <a href={book.digitalUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm text-white shrink-0 w-full sm:w-auto text-center" style={{ background: "#2563eb" }}>
                Accéder
              </a>
            </div>
          )}

          {/* PDF du livre */}
          {book.pdfFile && (
            <div className="rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)" }}>
              <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto sm:flex-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(34,197,94,0.15)" }}>
                  <FileText className="w-5 h-5" style={{ color: "#22c55e" }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>Version numérique disponible</p>
                  <p className="text-xs" style={{ color: "#22c55e" }}>Lisez ce livre directement dans l'application</p>
                </div>
              </div>
              <button onClick={() => setShowPdf(true)} className="btn btn-sm text-white shrink-0 w-full sm:w-auto text-center" style={{ background: "#16a34a" }}>
                <BookOpen className="w-4 h-4" /> Lire le PDF
              </button>
            </div>
          )}

          {showPdf && book.pdfFile && (
            <Suspense fallback={null}>
              <PdfViewer
                url={`${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}${book.pdfFile}`}
                onClose={() => setShowPdf(false)}
              />
            </Suspense>
          )}

          {/* Section Avis */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">Communauté</p>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
              <h2 className="text-2xl font-black text-primary">Avis des lecteurs</h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={reviewAvg} />
                  <span className="text-lg font-black text-primary">{reviewAvg}</span>
                  <span className="text-sm" style={{ color: "var(--muted)" }}>({reviews.length})</span>
                </div>
              )}
            </div>

            {/* Formulaire avis */}
            {user && (
              <div className="card rounded-2xl p-5 mb-5">
                <p className="font-semibold mb-3 text-sm" style={{ color: "var(--fg)" }}>{myReview ? "Modifier votre avis" : "Laisser un avis"}</p>
                <div className="flex items-center gap-2 mb-3">
                  <StarRating rating={myRating} interactive onRate={setMyRating} />
                  {myRating > 0 && <span className="text-sm" style={{ color: "var(--muted)" }}>{myRating}/5</span>}
                </div>
                <textarea
                  className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--border-md)", color: "var(--fg)" }}
                  rows={3}
                  placeholder="Votre commentaire (optionnel)"
                  value={myComment}
                  onChange={e => setMyComment(e.target.value)}
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={handleSubmitReview} disabled={submittingReview || !myRating} className="btn btn-sm bg-secondary text-white hover:bg-secondary/90">
                    {submittingReview ? "..." : myReview ? "Mettre à jour" : "Publier"}
                  </button>
                  {myReview && (
                    <button onClick={() => handleDeleteReview(myReview._id)} className="btn btn-sm btn-ghost text-red-500">
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Liste avis */}
            {reviews.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>Aucun avis pour l'instant. Soyez le premier !</p>
            ) : (
              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r._id} className="card rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>{r.user?.fullName || "Anonyme"}</p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>{r.user?.department || ""}</p>
                      </div>
                      <div className="text-right">
                        <StarRating rating={r.rating} />
                        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </div>
                    {r.comment && <p className="text-sm mt-3" style={{ color: "var(--muted)" }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Livres similaires */}
          {related.length > 0 && (
            <div>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Découvrir</p>
                  <h2 className="text-2xl font-black text-primary">Dans la même catégorie</h2>
                </div>
                <button onClick={() => navigate(`/category/${encodeURIComponent(book.category.toLowerCase())}`)} className="flex items-center gap-1 text-secondary font-semibold text-sm">
                  Voir tout <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                {related.map(b => (
                  <div key={b._id} onClick={() => navigate(`/book/${b._id}`)} className="shrink-0 w-28 cursor-pointer group">
                    <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-all">
                      <img src={b.cover} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <p className="mt-2 text-xs font-semibold truncate" style={{ color: "var(--fg)" }}>{b.title}</p>
                    <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{Array.isArray(b.author) ? b.author[0] : b.author}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — infos + action */}
        <div className="lg:col-span-1 space-y-4 mt-8 lg:mt-0">
          {/* Disponibilité */}
          <div className="card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-primary text-sm uppercase tracking-wider">Disponibilité</p>
              <span className={`badge ${book.availableCopies > 0 ? "badge-green" : "badge-red"}`}>
                {book.availableCopies > 0 ? `${book.availableCopies} dispo` : "Indisponible"}
              </span>
            </div>
            <div className="w-full rounded-full h-2" style={{ background: "var(--border-md)" }}>
              <div className="bg-secondary h-2 rounded-full" style={{ width: `${availabilityPct}%` }} />
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>{book.availableCopies} sur {book.copies} exemplaires disponibles</p>
          </div>

          {/* Infos */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">Détails</p>
            <div className="row-list">
              {[
                { icon: <Hash className="w-4 h-4" />, label: "ISBN", value: book.isbn },
                { icon: <Building2 className="w-4 h-4" />, label: "Éditeur", value: book.publisher },
                { icon: <Calendar className="w-4 h-4" />, label: "Année", value: book.year },
                { icon: <BookOpen className="w-4 h-4" />, label: "Pages", value: `${book.pages} pages` },
                book.location && { icon: <MapPin className="w-4 h-4" />, label: "Emplacement", value: book.location },
              ].filter(Boolean).map((info, i) => (
                <div key={i} className="row-item">
                  <div className="text-secondary shrink-0">{info.icon}</div>
                  <p className="text-sm w-20 shrink-0" style={{ color: "var(--muted)" }}>{info.label}</p>
                  <p className="font-semibold text-sm truncate" style={{ color: "var(--fg)" }}>{info.value || "—"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA desktop */}
          <div className="hidden lg:block space-y-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Durée d'emprunt</p>
                <p className="font-bold text-primary text-sm flex items-center gap-1"><Clock className="w-4 h-4" /> {loanDays} jours</p>
              </div>
            </div>
            {book.availableCopies > 0 ? (
              <button onClick={handleBorrow} disabled={borrowing}
                className="w-full h-14 rounded-2xl font-bold text-lg bg-secondary text-white hover:bg-secondary/90 shadow-lg shadow-secondary/30 disabled:opacity-60 transition-all">
                {borrowing ? <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : "Emprunter"}
              </button>
            ) : (
              <button disabled className="w-full h-14 rounded-2xl font-bold text-lg cursor-not-allowed" style={{ background: "var(--border-md)", color: "var(--muted)" }}>
                Indisponible
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CTA sticky mobile */}
      <div className="lg:hidden fixed left-0 right-0 z-50 backdrop-blur-md border-t px-4 py-3"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          bottom: "calc(64px + env(safe-area-inset-bottom))",
        }}
      >
        <div className="w-full flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs" style={{ color: "var(--muted)" }}>Durée d'emprunt</p>
            <p className="font-bold text-primary text-sm">{loanDays} jours</p>
          </div>
          {book.availableCopies > 0 ? (
            <button onClick={handleBorrow} disabled={borrowing}
              className="flex-1 h-14 rounded-2xl font-bold text-lg bg-secondary text-white hover:bg-secondary/90 shadow-lg shadow-secondary/30 disabled:opacity-60 transition-all">
              {borrowing ? <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : "Emprunter"}
            </button>
          ) : (
            <button disabled className="flex-1 h-14 rounded-2xl font-bold text-lg" style={{ background: "var(--border-md)", color: "var(--muted)" }}>Indisponible</button>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}