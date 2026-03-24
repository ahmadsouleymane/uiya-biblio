import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Navbar from "../components/navbar"
import Footer from "../components/footer"
import toast, { Toaster } from "react-hot-toast"
import { ArrowLeft, Camera, Loader2, X, Save } from "lucide-react"
import { getBookById, updateBook } from "../api/book"
import { getCategories } from "../api/category"
import { useTheme } from "../contexts/ThemeContext"

const CONDITIONS = [
  { value: "neuf", label: "Neuf" },
  { value: "bon", label: "Bon état" },
  { value: "usé", label: "Usé" },
  { value: "endommagé", label: "Endommagé" },
]

const Field = ({ k, placeholder, type = "text", form, errors, setField, ...rest }) => (
  <div>
    <input
      type={type}
      placeholder={placeholder}
      value={form[k]}
      onChange={e => setField(k, e.target.value)}
      className={`input ${errors[k] ? "input-error" : ""}`}
      {...rest}
    />
    {errors[k] && <p className="text-xs mt-1" style={{ color: "#e11d48" }}>{errors[k]}</p>}
  </div>
)

export default function EditBook() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const coverVideoRef = useRef(null)

  const [step, setStep] = useState("form") // form | cover-cam
  const [form, setForm] = useState({
    isbn: "", title: "", author: "", publisher: "", year: "",
    pages: "", category: "", cover: "", copies: 1,
    description: "", condition: "bon", location: "", digitalUrl: "",
  })
  const [originalBook, setOriginalBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [categories, setCategories] = useState([])

  // Charger le livre et les catégories
  useEffect(() => {
    Promise.all([getBookById(id), getCategories()])
      .then(([book, cats]) => {
        if (!book || book.message) {
          toast.error("Livre introuvable")
          navigate("/admin/livres")
          return
        }
        setOriginalBook(book)
        setForm({
          isbn: book.isbn || "",
          title: book.title || "",
          author: Array.isArray(book.author) ? book.author.join(", ") : book.author || "",
          publisher: book.publisher || "",
          year: book.year || "",
          pages: book.pages || "",
          category: book.category || "",
          cover: book.cover || "",
          copies: book.copies || 1,
          description: book.description || "",
          condition: book.condition || "bon",
          location: book.location || "",
          digitalUrl: book.digitalUrl || "",
        })
        if (Array.isArray(cats)) setCategories(cats)
      })
      .catch(() => {
        toast.error("Erreur lors du chargement")
        navigate("/admin/livres")
      })
      .finally(() => setLoading(false))
  }, [id])

  // Caméra couverture
  useEffect(() => {
    if (step !== "cover-cam") return
    let stream
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s
        if (coverVideoRef.current) { coverVideoRef.current.srcObject = s; coverVideoRef.current.play() }
      })
      .catch(() => { toast.error("Impossible d'accéder à la caméra"); setStep("form") })
    return () => stream?.getTracks().forEach((t) => t.stop())
  }, [step])

  const handleCaptureCover = () => {
    const video = coverVideoRef.current
    const vw = video.videoWidth
    const vh = video.videoHeight
    const rectW = vw * 0.65
    const rectH = rectW * 1.5
    const rx = (vw - rectW) / 2
    const ry = (vh - rectH) / 2
    const canvas = document.createElement("canvas")
    canvas.width = rectW
    canvas.height = rectH
    canvas.getContext("2d").drawImage(video, rx, ry, rectW, rectH, 0, 0, rectW, rectH)
    setForm((prev) => ({ ...prev, cover: canvas.toDataURL("image/jpeg", 0.85) }))
    video.srcObject?.getTracks().forEach((t) => t.stop())
    setStep("form")
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim())            e.title     = "Titre requis"
    if (!form.author.trim())           e.author    = "Auteur requis"
    if (!form.publisher.trim())        e.publisher = "Éditeur requis"
    if (!form.year.toString().trim())  e.year      = "Année requise"
    if (!form.pages.toString().trim()) e.pages     = "Pages requises"
    if (!form.category)                e.category  = "Catégorie requise"
    if (!form.cover.trim())            e.cover     = "Couverture requise"
    if (!form.copies || Number(form.copies) < 1) e.copies = "Quantité ≥ 1"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) { toast.error("Corrigez les erreurs"); return }
    setSaving(true)
    try {
      const copiesDiff = Number(form.copies) - (originalBook?.copies || 0)
      const newAvailable = Math.max(0, (originalBook?.availableCopies || 0) + copiesDiff)

      const data = await updateBook(id, {
        isbn:       form.isbn.trim(),
        title:      form.title.trim(),
        author:     form.author.split(",").map(a => a.trim()).filter(Boolean),
        publisher:  form.publisher.trim(),
        year:       form.year.toString().trim(),
        pages:      Number(form.pages),
        category:   form.category,
        cover:      form.cover.trim(),
        copies:     Number(form.copies),
        availableCopies: newAvailable,
        description: form.description.trim(),
        condition:   form.condition,
        location:    form.location.trim(),
        digitalUrl:  form.digitalUrl.trim(),
      })
      if (data._id) {
        toast.success("Livre modifié avec succès")
        navigate(`/book/${id}`)
      } else {
        toast.error(data.message || "Erreur lors de la modification")
      }
    } catch {
      toast.error("Erreur serveur")
    } finally {
      setSaving(false)
    }
  }

  const setField = (key, val) => {
    setForm(p => ({ ...p, [key]: val }))
    setErrors(p => ({ ...p, [key]: "" }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <Toaster position="top-right" />
      <Navbar />

      <div className="w-full px-4 py-8">

        {step === "form" && (
          <div className="space-y-5">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--muted)" }}>
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div>
              <p className="overline mb-1">Catalogue</p>
              <h1 className="text-2xl font-black text-primary">Modifier le livre</h1>
            </div>

            <div className="lg:grid lg:grid-cols-3 lg:gap-6">
              <div className="lg:col-span-2 card-p space-y-4">
                <Field k="isbn"      placeholder="ISBN" form={form} errors={errors} setField={setField} />
                <Field k="title"     placeholder="Titre *" form={form} errors={errors} setField={setField} />
                <Field k="author"    placeholder="Auteur(s) * (séparés par des virgules)" form={form} errors={errors} setField={setField} />
                <Field k="publisher" placeholder="Éditeur *" form={form} errors={errors} setField={setField} />

                <div className="grid grid-cols-2 gap-3">
                  <Field k="year"  placeholder="Année *" form={form} errors={errors} setField={setField} />
                  <Field k="pages" placeholder="Pages *" type="number" min={1} form={form} errors={errors} setField={setField} />
                </div>

                <div>
                  <select
                    value={form.category}
                    onChange={e => setField("category", e.target.value)}
                    className={`input ${errors.category ? "input-error" : ""}`}
                    style={{ color: form.category ? "var(--fg)" : "var(--muted)" }}
                  >
                    <option value="" disabled>Catégorie *</option>
                    {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                  {errors.category && <p className="text-xs mt-1" style={{ color: "#e11d48" }}>{errors.category}</p>}
                </div>

                <div>
                  <input
                    type="number" min={1} placeholder="Nombre d'exemplaires *"
                    value={form.copies}
                    onChange={e => setField("copies", e.target.value)}
                    className={`input ${errors.copies ? "input-error" : ""}`}
                  />
                  {errors.copies && <p className="text-xs mt-1" style={{ color: "#e11d48" }}>{errors.copies}</p>}
                </div>

                <div>
                  <textarea
                    placeholder="Description (optionnel)"
                    value={form.description}
                    onChange={e => setField("description", e.target.value)}
                    className="input resize-none"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select value={form.condition} onChange={e => setField("condition", e.target.value)} className="input">
                      {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <Field k="location" placeholder="Emplacement (ex: Salle A, Rayon 3)" form={form} errors={errors} setField={setField} />
                </div>

                <Field k="digitalUrl" placeholder="URL ressource numérique (optionnel)" form={form} errors={errors} setField={setField} />

                <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-lg w-full mt-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Enregistrer les modifications</>}
                </button>
              </div>

              {/* Couverture — sidebar */}
              <div className="lg:col-span-1 card-p space-y-4 mt-4 lg:mt-0">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Couverture *</p>
                {form.cover ? (
                  <div className="flex flex-col items-center gap-3">
                    <img src={form.cover} alt="cover" className="w-32 rounded-xl object-cover aspect-[2/3] shadow-md" />
                    <div className="flex gap-2">
                      <button onClick={() => setStep("cover-cam")} className="flex items-center gap-1 text-xs font-medium text-primary">
                        <Camera className="w-3 h-3" /> Reprendre
                      </button>
                      <button onClick={() => { setForm(p => ({ ...p, cover: "" })); setErrors(p => ({ ...p, cover: "Photo requise" })) }} className="flex items-center gap-1 text-xs" style={{ color: "#e11d48" }}>
                        <X className="w-3 h-3" /> Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => setStep("cover-cam")}
                      className={`btn btn-primary w-full ${errors.cover ? "ring-2 ring-red-400" : ""}`}
                    >
                      <Camera className="w-4 h-4" /> Photographier la couverture
                    </button>
                    {errors.cover && <p className="text-xs" style={{ color: "#e11d48" }}>{errors.cover}</p>}
                    <div className="aspect-[2/3] rounded-xl border-2 border-dashed flex items-center justify-center" style={{ borderColor: "var(--border-md)" }}>
                      <p className="text-xs text-center px-2" style={{ color: "var(--muted)" }}>Aperçu de la couverture</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Caméra couverture */}
        {step === "cover-cam" && (
          <div className="card-p space-y-4">
            <p className="text-xl font-black text-primary text-center">Photographiez la couverture</p>
            <p className="text-sm text-center" style={{ color: "var(--muted)" }}>Placez le livre dans le rectangle</p>
            <div className="relative w-full rounded-xl overflow-hidden" style={{ height: "24rem" }}>
              <video ref={coverVideoRef} className="w-full h-full bg-black object-cover" autoPlay muted playsInline />
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.55) 100%)",
                maskImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='white'/%3E%3Crect x='17.5' y='12.5' width='65' height='75' rx='3' fill='black'/%3E%3C/svg%3E\")",
                WebkitMaskImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='white'/%3E%3Crect x='17.5' y='12.5' width='65' height='75' rx='3' fill='black'/%3E%3C/svg%3E\")",
                maskSize: "100% 100%",
                WebkitMaskSize: "100% 100%",
              }} />
              <div className="absolute pointer-events-none rounded-md" style={{
                left: "17.5%", top: "12.5%", width: "65%", height: "75%",
                border: "2.5px solid rgba(255,255,255,0.85)",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
              }}>
                <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-3 border-l-3 rounded-tl-md" style={{ borderColor: "white" }} />
                <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-3 border-r-3 rounded-tr-md" style={{ borderColor: "white" }} />
                <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-3 border-l-3 rounded-bl-md" style={{ borderColor: "white" }} />
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-3 border-r-3 rounded-br-md" style={{ borderColor: "white" }} />
              </div>
            </div>
            <button onClick={handleCaptureCover} className="btn btn-primary btn-lg w-full">
              <Camera className="w-5 h-5" /> Prendre la photo
            </button>
            <button onClick={() => setStep("form")} className="btn btn-ghost w-full">Annuler</button>
          </div>
        )}

      </div>
      <Footer />
    </div>
  )
}
