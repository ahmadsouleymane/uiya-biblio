import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader } from "@zxing/library"
import Navbar from "../components/navbar"
import Footer from "../components/footer"
import toast, { Toaster } from "react-hot-toast"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Barcode, PenLine, Camera, CheckCircle, Loader2, X, Sparkles, Upload, FileText, FileUp } from "lucide-react"
import { addBook, generateBookDescription, uploadBookPdf } from "../api/book"
import { getCategories } from "../api/category"
import { useTheme } from "../contexts/ThemeContext"
import { extractPdfMetadata } from "../utils/pdfMetadata"

const EMPTY_FORM = {
  isbn: "", title: "", author: "", publisher: "", year: "",
  pages: "", category: "", cover: "", copies: 1,
  description: "", condition: "bon", location: "",
}

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

export default function AddBook() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const dark = theme === "dark"
  const scanVideoRef = useRef(null)
  const coverVideoRef = useRef(null)
  const coverFileRef = useRef(null)

  const [step, setStep] = useState("method") // method | scan | form | cover-cam | done
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [categories, setCategories] = useState([])
  const [generating, setGenerating] = useState(false)
  const [pdfFile, setPdfFile] = useState(null)
  const pdfFileRef = useRef(null)
  const ebookImportRef = useRef(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => { getCategories().then(data => { if (Array.isArray(data)) setCategories(data) }).catch(() => {}) }, [])

  // ── Barcode scanner ──────────────────────────────────────────────
  useEffect(() => {
    if (step !== "scan") return
    const reader = new BrowserMultiFormatReader()
    let active = true

    reader.listVideoInputDevices().then(devices => {
      const back = devices.find(d => /back|rear|environment/i.test(d.label))
      const deviceId = back?.deviceId || null
      return reader.decodeFromVideoDevice(deviceId, scanVideoRef.current, async (result) => {
        if (!result || !active) return
        const code = result.getText()
        if (!code.startsWith("978") && !code.startsWith("979")) return
        active = false
        reader.reset()
        new Audio("/done.mp3").play().catch(() => {})
        toast.loading("Recherche du livre…", { id: "isbn" })

        try {
          const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${code}&format=json&jscmd=data`)
          const data = await res.json()
          const b = data[`ISBN:${code}`]
          toast.dismiss("isbn")
          if (b) {
            const filledForm = {
              ...EMPTY_FORM,
              isbn: code,
              title: b.title || "",
              author: b.authors?.[0]?.name || "",
              publisher: b.publishers?.[0]?.name || b.publishers?.[0] || "",
              year: b.publish_date || "",
              pages: b.number_of_pages || "",
              category: "",
              cover: b.cover?.large || b.cover?.medium || "",
              copies: 1,
            }
            setForm(filledForm)

            // Pré-marquer les champs manquants
            const e = {}
            if (!filledForm.author)    e.author    = "À compléter"
            if (!filledForm.publisher) e.publisher = "À compléter"
            if (!filledForm.year)      e.year      = "À compléter"
            if (!filledForm.pages)     e.pages     = "À compléter"
            if (!filledForm.cover)     e.cover     = "Photo requise"
            e.category = "À sélectionner"
            setErrors(e)

            const missing = Object.keys(e).filter(k => k !== "category")
            if (missing.length > 0) {
              const labels = { author: "Auteur", publisher: "Éditeur", year: "Année", pages: "Pages", cover: "Couverture" }
              toast(`Livre trouvé — à compléter : ${missing.map(k => labels[k]).join(", ")}`, { icon: "✏️", duration: 5000 })
            } else {
              toast.success("Livre trouvé ! Sélectionnez la catégorie.")
            }
          } else {
            setForm({ ...EMPTY_FORM, isbn: code })
            toast("ISBN scanné — complétez manuellement.", { icon: "ℹ️" })
          }
        } catch {
          toast.dismiss("isbn")
          setForm({ ...EMPTY_FORM, isbn: code })
          toast.error("Erreur API OpenLibrary")
        }
        setStep("form")
      })
    })

    return () => { active = false; reader.reset() }
  }, [step])

  // ── Cover camera ─────────────────────────────────────────────────
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

    // Rectangle guide : 65% largeur, ratio 2:3 (couverture de livre)
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

  // Redimensionne + compresse une image avant de la stocker en base64
  // (évite les payloads >10 Mo qui faisaient échouer l'ajout avec "Erreur serveur")
  const compressImage = (file, maxSize = 1000, quality = 0.8) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
          const w = Math.round(img.width * scale)
          const h = Math.round(img.height * scale)
          const canvas = document.createElement("canvas")
          canvas.width = w
          canvas.height = h
          canvas.getContext("2d").drawImage(img, 0, 0, w, h)
          resolve(canvas.toDataURL("image/jpeg", quality))
        }
        img.onerror = reject
        img.src = reader.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    try {
      const compressed = await compressImage(file)
      setField("cover", compressed)
    } catch {
      toast.error("Impossible de traiter cette image")
    }
  }

  // ── Import depuis un fichier PDF (ebook) ──────────────────────────
  const handleEbookImport = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (file.type !== "application/pdf") {
      toast.error("Le fichier doit être un PDF")
      return
    }
    setImporting(true)
    toast.loading("Extraction des informations du PDF…", { id: "pdf-import" })
    try {
      const meta = await extractPdfMetadata(file)
      const filled = {
        ...EMPTY_FORM,
        isbn: meta.isbn || "",
        title: meta.title || "",
        author: meta.author || "",
        publisher: meta.publisher || "",
        year: meta.year || "",
        pages: meta.pages || "",
        cover: meta.cover || "",
        copies: 1,
      }
      setForm(filled)
      setPdfFile(file)

      const errs = {}
      if (!filled.title)     errs.title     = "À compléter"
      if (!filled.author)    errs.author    = "À compléter"
      if (!filled.publisher) errs.publisher = "À compléter"
      if (!filled.year)      errs.year      = "À compléter"
      if (!filled.pages)     errs.pages     = "À compléter"
      if (!filled.cover)     errs.cover     = "Couverture requise"
      errs.category = "À sélectionner"
      setErrors(errs)

      toast.dismiss("pdf-import")
      toast.success("Informations extraites du PDF !")
      setStep("form")
    } catch (err) {
      console.error(err)
      toast.dismiss("pdf-import")
      toast.error("Impossible de lire ce PDF")
    } finally {
      setImporting(false)
    }
  }

  // ── Génération IA de description ──────────────────────────────────
  const handleGenerateDescription = async () => {
    if (!form.title.trim() || !form.author.trim()) {
      toast.error("Remplissez le titre et l'auteur d'abord")
      return
    }
    setGenerating(true)
    try {
      const data = await generateBookDescription(form.title.trim(), form.author.trim())
      if (data.description) {
        setField("description", data.description)
        toast.success("Description générée !")
      } else {
        toast.error(data.message || "Erreur lors de la génération")
      }
    } catch {
      toast.error("Erreur lors de la génération")
    } finally {
      setGenerating(false)
    }
  }

  // ── Validation ───────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.title.trim())          e.title     = "Titre requis"
    if (!form.author.trim())         e.author    = "Auteur requis"
    if (!form.publisher.trim())      e.publisher = "Éditeur requis"
    if (!form.year.toString().trim()) e.year     = "Année requise"
    if (!form.pages.toString().trim()) e.pages   = "Pages requises"
    if (!form.category)              e.category  = "Catégorie requise"
    if (!form.cover.trim())          e.cover     = "Couverture requise"
    if (!form.copies || Number(form.copies) < 1) e.copies = "Quantité ≥ 1"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (loading) return
    if (!validate()) { toast.error("Corrigez les erreurs"); return }
    setLoading(true)
    const isbnValue = form.isbn.trim() || `UIYA-${Date.now()}`
    try {
      const data = await addBook({
        isbn:       isbnValue,
        title:      form.title.trim(),
        author:     form.author.trim(),
        publisher:  form.publisher.trim(),
        year:       form.year.toString().trim(),
        pages:      Number(form.pages),
        category:   form.category,
        cover:      form.cover.trim(),
        copies:     Number(form.copies),
        description: form.description.trim(),
        condition:   form.condition,
        location:    form.location.trim(),
      })
      if (data.book) {
        if (pdfFile) {
          try { await uploadBookPdf(data.book._id, pdfFile) }
          catch { toast.error("Livre ajouté mais erreur lors de l'upload du PDF") }
        }
        setStep("done")
      } else toast.error(data.message || "Erreur lors de l'ajout")
    } catch {
      toast.error("Erreur serveur")
    } finally {
      setLoading(false)
    }
  }

  const setField = (key, val) => {
    setForm(p => ({ ...p, [key]: val }))
    setErrors(p => ({ ...p, [key]: "" }))
  }


  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <Toaster position="top-right" />
      <Navbar />

      <div className="w-full px-4 py-8">

        {/* ── Choix de méthode ─────────────────────────────── */}
        {step === "method" && (
          <div className="space-y-6">
            <div>
              <p className="overline mb-1">Catalogue</p>
              <h1 className="text-xl md:text-3xl font-black text-primary">Ajouter un livre</h1>
            </div>

            <input
              ref={ebookImportRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleEbookImport}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <button onClick={() => setStep("scan")}
                className="w-full text-white rounded-2xl p-5 sm:p-8 flex items-center gap-4 sm:gap-6 text-left hover:opacity-90 transition-opacity"
                style={{ background: dark ? "linear-gradient(135deg, #1c0a0e 0%, #2e1018 100%)" : "linear-gradient(135deg, #040848 0%, #0a1260 100%)" }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.12)" }}>
                  <Barcode className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xl font-black">Scanner le code-barres</p>
                  <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>Les infos se remplissent automatiquement via OpenLibrary</p>
                </div>
              </button>

              <button onClick={() => { setForm(EMPTY_FORM); setStep("form") }}
                className="w-full text-white rounded-2xl p-5 sm:p-8 flex items-center gap-4 sm:gap-6 text-left hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg, #A71E3C 0%, #8b1730 100%)" }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.12)" }}>
                  <PenLine className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xl font-black">Saisie manuelle</p>
                  <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>Remplis les informations du livre à la main</p>
                </div>
              </button>

              <button
                onClick={() => !importing && ebookImportRef.current?.click()}
                disabled={importing}
                className="w-full text-white rounded-2xl p-5 sm:p-8 flex items-center gap-4 sm:gap-6 text-left hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #166534 0%, #15803d 100%)" }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.12)" }}>
                  {importing ? <Loader2 className="w-7 h-7 animate-spin" /> : <FileUp className="w-7 h-7" />}
                </div>
                <div>
                  <p className="text-xl font-black">Importer depuis un PDF</p>
                  <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Titre, auteur, pages et couverture extraits automatiquement de l'ebook
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── Scanner ISBN ─────────────────────────────────── */}
        {step === "scan" && (
          <div className="space-y-5">
            <button onClick={() => setStep("method")} className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--muted)" }}>
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="card-p space-y-4">
              <p className="text-xl font-black text-primary text-center">Scanner le code-barres ISBN</p>
              <p className="text-sm text-center" style={{ color: "var(--muted)" }}>Le code commence par 978 ou 979</p>
              <video ref={scanVideoRef} className="w-full h-64 rounded-xl bg-black object-cover" />
              <button onClick={() => setStep("method")} className="btn btn-ghost w-full">Annuler</button>
            </div>
          </div>
        )}

        {/* ── Formulaire ───────────────────────────────────── */}
        {step === "form" && (
          <div className="space-y-5">
            <button onClick={() => setStep("method")} className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--muted)" }}>
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div>
              <p className="overline mb-1">Catalogue</p>
              <h1 className="text-2xl font-black text-primary">Informations du livre</h1>
            </div>

            <div className="lg:grid lg:grid-cols-3 lg:gap-6">
              {/* Champs du formulaire */}
              <div className="lg:col-span-2 card-p space-y-4">
                <Field k="isbn"      placeholder="ISBN (optionnel — généré automatiquement si vide)" form={form} errors={errors} setField={setField} />
                <Field k="title"     placeholder="Titre *" form={form} errors={errors} setField={setField} />
                <Field k="author"    placeholder="Auteur *" form={form} errors={errors} setField={setField} />
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

                {/* Description avec génération IA */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Description (optionnel)</label>
                    <button
                      type="button"
                      onClick={handleGenerateDescription}
                      disabled={generating || !form.title.trim() || !form.author.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)", color: "#fff" }}
                    >
                      {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {generating ? "Génération…" : "Générer avec IA"}
                    </button>
                  </div>
                  <textarea
                    placeholder="Description du livre — ou cliquez sur « Générer avec IA »"
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

                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--muted)" }}>Fichier PDF du livre (optionnel)</label>
                  <input type="file" accept="application/pdf" ref={pdfFileRef} className="hidden" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
                  {pdfFile ? (
                    <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "var(--bg-card)" }}>
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm truncate flex-1">{pdfFile.name}</span>
                      <button type="button" onClick={() => { setPdfFile(null); if (pdfFileRef.current) pdfFileRef.current.value = "" }} className="text-xs" style={{ color: "#e11d48" }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => pdfFileRef.current?.click()} className="btn btn-ghost w-full">
                      <Upload className="w-4 h-4" /> Ajouter un PDF
                    </button>
                  )}
                </div>

                <button onClick={handleSave} disabled={loading} className="btn btn-primary btn-lg w-full mt-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sauvegarder le livre"}
                </button>
              </div>

              {/* Couverture — sidebar droite */}
              <div className="lg:col-span-1 card-p space-y-4 mt-4 lg:mt-0">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Couverture *</p>
                {form.cover ? (
                  <div className="flex flex-col items-center gap-3">
                    <img src={form.cover} alt="cover" className="w-32 rounded-xl object-cover aspect-[2/3] shadow-md" />
                    <button onClick={() => { setForm(p => ({ ...p, cover: "" })); setErrors(p => ({ ...p, cover: "Photo requise" })) }} className="flex items-center gap-1 text-xs" style={{ color: "#e11d48" }}>
                      <X className="w-3 h-3" /> Supprimer
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input type="file" accept="image/*" ref={coverFileRef} className="hidden" onChange={handleCoverUpload} />
                    <button
                      onClick={() => coverFileRef.current?.click()}
                      className={`btn btn-primary w-full ${errors.cover ? "ring-2 ring-red-400" : ""}`}
                    >
                      <Upload className="w-4 h-4" /> Téléverser une image
                    </button>
                    <button
                      onClick={() => setStep("cover-cam")}
                      className="btn btn-ghost w-full"
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

        {/* ── Caméra couverture ────────────────────────────── */}
        {step === "cover-cam" && (
          <div className="card-p space-y-4">
            <p className="text-xl font-black text-primary text-center">Photographiez la couverture</p>
            <p className="text-sm text-center" style={{ color: "var(--muted)" }}>Placez le livre dans le rectangle</p>
            <div className="relative w-full rounded-xl overflow-hidden" style={{ height: "24rem" }}>
              <video ref={coverVideoRef} className="w-full h-full bg-black object-cover" autoPlay muted playsInline />
              {/* Overlay sombre avec découpe rectangle */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.55) 100%)",
                maskImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='white'/%3E%3Crect x='17.5' y='12.5' width='65' height='75' rx='3' fill='black'/%3E%3C/svg%3E\")",
                WebkitMaskImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='white'/%3E%3Crect x='17.5' y='12.5' width='65' height='75' rx='3' fill='black'/%3E%3C/svg%3E\")",
                maskSize: "100% 100%",
                WebkitMaskSize: "100% 100%",
              }} />
              {/* Bordure du rectangle guide */}
              <div className="absolute pointer-events-none rounded-md" style={{
                left: "17.5%", top: "12.5%", width: "65%", height: "75%",
                border: "2.5px solid rgba(255,255,255,0.85)",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
              }}>
                {/* Coins décoratifs */}
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

        {/* ── Succès ───────────────────────────────────────── */}
        {step === "done" && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center fade-in-up">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#ecfdf5" }}>
              <CheckCircle className="w-10 h-10" style={{ color: "#059669" }} />
            </div>
            <div>
              <p className="text-2xl font-black text-primary">Livre ajouté !</p>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>"{form.title}" est dans le catalogue</p>
            </div>
            <div className="flex gap-3 w-full max-w-xs">
              <button onClick={() => { setForm(EMPTY_FORM); setStep("method") }} className="btn btn-primary flex-1">
                Ajouter un autre
              </button>
              <button onClick={() => navigate("/admin/livres")} className="btn btn-ghost flex-1">
                Voir les livres
              </button>
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>
  )
}