import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Upload, CheckCircle, XCircle, FileText } from "lucide-react"
import toast from "react-hot-toast"
import Navbar from "../../components/navbar"
import Footer from "../../components/footer"
import { importBooksCsv } from "../../api/book"
import { importUsersCsv } from "../../api/user"

export default function AdminImport() {
  const navigate = useNavigate()
  const [type, setType] = useState("books")
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleImport = async () => {
    if (!file) { toast.error("Sélectionnez un fichier CSV"); return }
    setLoading(true)
    setResult(null)
    try {
      const data = type === "books" ? await importBooksCsv(file) : await importUsersCsv(file)
      setResult(data)
      if (data.inserted !== undefined) {
        toast.success(`Import terminé: ${data.inserted} ajouté(s)${data.updated ? `, ${data.updated} mis à jour` : ""}`)
      } else {
        toast.error(data.message || "Erreur")
      }
    } catch {
      toast.error("Erreur lors de l'import")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate("/admin")} className="w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:bg-surface/80 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black">Import CSV</h1>
            <p className="text-muted text-sm">Importer des livres ou des utilisateurs en masse</p>
          </div>
        </div>

        <div className="card p-6 space-y-5">
          {/* Type */}
          <div>
            <p className="font-bold mb-2">Type d'import</p>
            <div className="flex gap-3">
              <button onClick={() => setType("books")} className={`btn ${type === "books" ? "btn-primary" : "btn-ghost"}`}>Livres</button>
              <button onClick={() => setType("users")} className={`btn ${type === "users" ? "btn-primary" : "btn-ghost"}`}>Utilisateurs</button>
            </div>
          </div>

          {/* Format */}
          <div className="bg-surface rounded-xl p-4 text-sm">
            <p className="font-semibold mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Colonnes attendues :</p>
            {type === "books" ? (
              <p className="text-muted font-mono text-xs">isbn, title, author (séparés par ;), publisher, year, pages, category, cover, copies, description, condition (neuf/bon/usé/endommagé), location, digitalUrl</p>
            ) : (
              <p className="text-muted font-mono text-xs">fullName, email, phone, password, department, year, role (student/employee/admin)</p>
            )}
          </div>

          {/* Upload */}
          <div>
            <p className="font-bold mb-2">Fichier CSV</p>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-surface hover:border-primary transition-colors rounded-xl p-8 cursor-pointer">
              <Upload className="w-8 h-8 text-muted mb-2" />
              <p className="text-sm font-semibold">{file ? file.name : "Cliquez ou glissez un fichier CSV"}</p>
              <p className="text-xs text-muted mt-1">CSV uniquement, max 10 MB</p>
              <input type="file" accept=".csv" className="hidden" onChange={e => setFile(e.target.files[0])} />
            </label>
          </div>

          <button onClick={handleImport} disabled={loading || !file} className="btn btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Upload className="w-4 h-4" /> Importer</>}
          </button>
        </div>

        {/* Résultats */}
        {result && (
          <div className="card p-5 mt-4 space-y-3">
            <p className="font-bold">Résultats de l'import</p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">{result.inserted} ajouté(s)</span>
              </div>
              {result.updated > 0 && (
                <div className="flex items-center gap-2 text-blue-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">{result.updated} mis à jour</span>
                </div>
              )}
              {result.errors?.length > 0 && (
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle className="w-5 h-5" />
                  <span className="font-semibold">{result.errors.length} erreur(s)</span>
                </div>
              )}
            </div>
            {result.errors?.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-red-400">Détail des erreurs :</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-muted bg-surface rounded px-3 py-1.5">
                      {e.isbn || e.email || `Ligne ${i + 1}`} — {e.reason}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}