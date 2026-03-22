import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, MapPin, Calendar, Plus, Trash2, X, ImagePlus, Users, Mail, Phone, GraduationCap, CheckCircle } from "lucide-react"
import { useUser } from "../contexts/AuthContext"
import { getEvents, addEvent, deleteEvent, getRegistrations, registerForEvent, unregisterFromEvent } from "../api/event"
import Navbar from "../components/navbar"
import Footer from "../components/footer"
import toast from "react-hot-toast"

const EMPTY_FORM = { title: "", date: "", location: "", description: "" }

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
}

function isPast(dateStr) {
  return new Date(dateStr) < new Date()
}

export default function Activity() {
  const { user } = useUser()
  const navigate = useNavigate()
  const isAdmin = user?.role === "admin"

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [posterFile, setPosterFile] = useState(null)
  const [posterPreview, setPosterPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loadingRegs, setLoadingRegs] = useState(false)
  const [registering, setRegistering] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    getEvents()
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  const handlePosterChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPosterFile(file)
    setPosterPreview(URL.createObjectURL(file))
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setPosterFile(null)
    setPosterPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !posterFile || !form.date || !form.location || !form.description) {
      toast.error("Veuillez remplir tous les champs")
      return
    }
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append("title", form.title)
      formData.append("date", form.date)
      formData.append("location", form.location)
      formData.append("description", form.description)
      formData.append("poster", posterFile)

      const res = await addEvent(formData)
      if (res.event) {
        setEvents(prev => [...prev, res.event].sort((a, b) => new Date(a.date) - new Date(b.date)))
        resetForm()
        setShowForm(false)
        toast.success("Activité ajoutée")
      } else {
        toast.error(res.message || "Erreur")
      }
    } catch {
      toast.error("Erreur serveur")
    } finally {
      setSaving(false)
    }
  }

  const openDetail = (event) => {
    setSelected(event)
    if (isAdmin) {
      setLoadingRegs(true)
      getRegistrations(event._id)
        .then(data => setRegistrations(Array.isArray(data) ? data : []))
        .catch(() => setRegistrations([]))
        .finally(() => setLoadingRegs(false))
    }
  }

  const isRegistered = selected?.registrations?.includes(user?._id)

  const handleRegister = async () => {
    if (!selected) return
    setRegistering(true)
    try {
      if (isRegistered) {
        await unregisterFromEvent(selected._id)
        setSelected(prev => ({ ...prev, registrations: prev.registrations.filter(id => id !== user._id) }))
        toast.success("Inscription annulée")
      } else {
        await registerForEvent(selected._id)
        setSelected(prev => ({ ...prev, registrations: [...(prev.registrations || []), user._id] }))
        toast.success("Inscription confirmée !")
      }
    } catch {
      toast.error("Erreur, réessayez")
    } finally {
      setRegistering(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      const res = await deleteEvent(id)
      if (res.message === "Activité supprimée") {
        setEvents(prev => prev.filter(e => e._id !== id))
        toast.success("Activité supprimée")
      } else {
        toast.error(res.message || "Erreur")
      }
    } catch {
      toast.error("Erreur serveur")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #040848 0%, #0a1260 100%)" }} className="text-white">
        <div className="max-w-5xl mx-auto px-4 pt-10 pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-widest font-semibold">Bibliothèque</p>
                <h1 className="text-2xl font-black">Activités</h1>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all"
                style={{ background: "#A71E3C", color: "#fff" }}
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col md:flex-row"
            style={{ background: "var(--surface)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Poster */}
            <div className="md:w-1/2 shrink-0 relative h-52 md:h-auto md:self-stretch" style={{ background: "#f1f3f9" }}>
              <img
                src={selected.poster}
                alt={selected.title}
                className="absolute inset-0 w-full h-full object-contain"
              />
              {isPast(selected.date) && (
                <div className="absolute inset-0 flex items-start justify-start p-3" style={{ background: "rgba(0,0,0,0.35)" }}>
                  <span className="px-3 py-1 rounded-full text-xs font-black" style={{ background: "var(--surface)", color: "var(--fg)" }}>
                    Terminé
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
              <button
                onClick={() => setSelected(null)}
                className="self-end w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center mb-4 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="font-black text-primary text-xl leading-tight mb-4">{selected.title}</h2>

              <div className="flex flex-col gap-3 mb-5">
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "rgba(167,30,60,0.06)" }}>
                  <Calendar className="w-4 h-4 shrink-0" style={{ color: "#A71E3C" }} />
                  <span className="text-sm font-bold capitalize" style={{ color: "#A71E3C" }}>{formatDate(selected.date)}</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "rgba(124,58,237,0.06)" }}>
                  <MapPin className="w-4 h-4 shrink-0" style={{ color: "#7c3aed" }} />
                  <span className="text-sm font-bold" style={{ color: "#7c3aed" }}>{selected.location}</span>
                </div>
              </div>

              <p className="text-sm leading-relaxed mb-5" style={{ color: "#475569" }}>{selected.description}</p>

              {/* Bouton inscription — utilisateurs non-admin */}
              {!isAdmin && user && !isPast(selected.date) && (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="w-full py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all mb-4"
                  style={isRegistered
                    ? { background: "rgba(34,197,94,0.10)", color: "#16a34a", border: "1.5px solid rgba(34,197,94,0.25)" }
                    : { background: "#040848", color: "#fff" }
                  }
                >
                  {registering
                    ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : isRegistered
                      ? <><CheckCircle className="w-4 h-4" /> Inscrit — Annuler mon inscription</>
                      : "S'inscrire à cet événement"
                  }
                </button>
              )}

              {isAdmin && (
                <>
                  {/* Inscrits */}
                  <div className="pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4" style={{ color: "#040848" }} />
                      <p className="font-black text-primary text-sm">
                        Inscrits {!loadingRegs && `(${registrations.length})`}
                      </p>
                    </div>

                    {loadingRegs ? (
                      <div className="space-y-2">
                        {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
                      </div>
                    ) : registrations.length === 0 ? (
                      <p className="text-xs py-3 text-center rounded-xl" style={{ color: "var(--muted)", background: "rgba(4,8,72,0.03)" }}>
                        Aucun inscrit pour l'instant
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {registrations.map(u => (
                          <div key={u._id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(4,8,72,0.03)" }}>
                            <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-black" style={{ background: "#040848" }}>
                              {u.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-primary truncate">{u.fullName}</p>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                                  <Mail className="w-3 h-3" />{u.email}
                                </span>
                                {u.phone && (
                                  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                                    <Phone className="w-3 h-3" />{u.phone}
                                  </span>
                                )}
                                {u.department && (
                                  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                                    <GraduationCap className="w-3 h-3" />{u.department}{u.year ? ` — ${u.year}` : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => { handleDelete(selected._id); setSelected(null) }}
                    disabled={deletingId === selected._id}
                    className="mt-4 flex items-center gap-2 text-xs font-bold transition-opacity"
                    style={{ color: "#A71E3C", opacity: deletingId === selected._id ? 0.5 : 1 }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer cette activité
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-3xl overflow-hidden" style={{ background: "var(--surface)" }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-black text-primary text-lg">Nouvelle activité</h2>
              <button onClick={() => { setShowForm(false); resetForm() }} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-primary/60 mb-1 uppercase tracking-wide">Titre</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Nom de l'activité"
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold outline-none border"
                  style={{ borderColor: "var(--border-md)", background: "var(--bg)" }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary/60 mb-1 uppercase tracking-wide">Affiche</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePosterChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed transition-colors overflow-hidden"
                  style={{ borderColor: posterPreview ? "transparent" : "var(--border-md)" }}
                >
                  {posterPreview ? (
                    <div style={{ aspectRatio: "1 / 1.414", background: "#f1f3f9" }} className="relative w-full">
                      <img src={posterPreview} alt="Aperçu" className="absolute inset-0 w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-6" style={{ color: "var(--muted)" }}>
                      <ImagePlus className="w-7 h-7" />
                      <span className="text-xs font-semibold">Cliquer pour choisir une image</span>
                      <span className="text-xs">JPG, PNG, WEBP — max 5 Mo</span>
                    </div>
                  )}
                </button>
                {posterPreview && (
                  <button
                    type="button"
                    onClick={() => { setPosterFile(null); setPosterPreview(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                    className="mt-1 text-xs font-semibold"
                    style={{ color: "#A71E3C" }}
                  >
                    Changer l'image
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary/60 mb-1 uppercase tracking-wide">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold outline-none border"
                    style={{ borderColor: "var(--border-md)", background: "var(--bg)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary/60 mb-1 uppercase tracking-wide">Lieu</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="Salle, bâtiment…"
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold outline-none border"
                    style={{ borderColor: "var(--border-md)", background: "var(--bg)" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary/60 mb-1 uppercase tracking-wide">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Décrivez brièvement l'activité…"
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold outline-none border resize-none"
                  style={{ borderColor: "var(--border-md)", background: "var(--bg)" }}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-black transition-opacity"
                style={{ background: "#040848", color: "#fff", opacity: saving ? 0.6 : 1 }}
              >
                {saving ? "Enregistrement…" : "Ajouter l'activité"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="skeleton h-80 rounded-3xl" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center" style={{ color: "var(--muted)" }}>
            <Calendar className="w-14 h-14 mx-auto mb-4 opacity-20" />
            <p className="font-black text-lg">Aucune activité</p>
            <p className="text-sm mt-1">Les activités à venir apparaîtront ici</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map(event => {
              const past = isPast(event.date)
              return (
                <div
                  key={event._id}
                  onClick={() => openDetail(event)}
                  className="rounded-3xl overflow-hidden flex flex-col cursor-pointer group"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", opacity: past ? 0.65 : 1 }}
                >
                  {/* Poster */}
                  <div className="relative" style={{ aspectRatio: "1 / 1.414", background: "#f1f3f9" }}>
                    <img
                      src={event.poster}
                      alt={event.title}
                      className="absolute inset-0 w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                      onError={e => { e.target.style.display = "none" }}
                    />
                    {past && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
                        <span className="px-3 py-1 rounded-full text-xs font-black" style={{ background: "var(--surface)", color: "var(--fg)" }}>
                          Terminé
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(4,8,72,0.18)" }}>
                      <span className="px-4 py-2 rounded-full text-xs font-black" style={{ background: "var(--surface)", color: "var(--fg)" }}>
                        Voir les détails
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col gap-1.5">
                    <h3 className="font-black text-primary text-sm leading-tight">{event.title}</h3>
                    <div className="flex items-center gap-1.5" style={{ color: "#A71E3C" }}>
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span className="text-xs font-semibold capitalize">{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5" style={{ color: "#7c3aed" }}>
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="text-xs font-semibold">{event.location}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}