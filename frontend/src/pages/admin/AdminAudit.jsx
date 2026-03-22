import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Shield, ChevronLeft, ChevronRight } from "lucide-react"
import Navbar from "../../components/navbar"
import Footer from "../../components/footer"
import { getAuditLogs } from "../../api/audit"

const ACTION_COLORS = {
  DELETE_USER: "text-red-400",
  DELETE_BOOK: "text-red-400",
  DELETE_FINE: "text-red-400",
  CHANGE_ROLE: "text-yellow-400",
  CREATE_FINE: "text-orange-400",
  PAY_FINE: "text-green-400",
  IMPORT_BOOKS_CSV: "text-blue-400",
  IMPORT_USERS_CSV: "text-blue-400",
}

export default function AdminAudit() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getAuditLogs({ page, limit: 50 })
      if (data.logs) {
        setLogs(data.logs)
        setTotal(data.total)
        setPages(data.pages)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate("/admin")} className="w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:bg-surface/80 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" />
            <div>
              <h1 className="text-2xl font-black">Journal d'audit</h1>
              <p className="text-muted text-sm">{total} action(s) enregistrée(s) (90 jours)</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center text-muted py-16">Aucune action enregistrée</div>
        ) : (
          <>
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log._id} className="card p-4 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${ACTION_COLORS[log.action] || "text-foreground"}`}>{log.action}</span>
                      {log.entity && <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded-full">{log.entity}</span>}
                    </div>
                    <p className="text-sm text-muted mt-0.5">
                      par <span className="text-foreground font-medium">{log.user?.fullName || "Système"}</span>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <span> — {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(", ")}</span>
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-muted flex-shrink-0">
                    {new Date(log.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-sm btn-ghost">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-muted">Page {page} / {pages}</span>
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="btn btn-sm btn-ghost">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}