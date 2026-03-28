import { useEffect, useState, useRef } from "react"
import { MessageCircle, Wifi, WifiOff, Send, Users, RefreshCw, Loader2, Power, PowerOff } from "lucide-react"
import Navbar from "../../components/navbar"
import Footer from "../../components/footer"
import { apiFetch } from "../../api/_fetch"
import toast from "react-hot-toast"

const API = import.meta.env.VITE_API_URL

export default function AdminWhatsApp() {
  const [status, setStatus] = useState("disconnected")
  const [qrCode, setQrCode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [testPhone, setTestPhone] = useState("")
  const [testMessage, setTestMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [bulkMessage, setBulkMessage] = useState("")
  const [bulkRole, setBulkRole] = useState("all")
  const [bulkSending, setBulkSending] = useState(false)
  const [debugInfo, setDebugInfo] = useState("")
  const pollRef = useRef(null)

  const fetchStatus = async () => {
    try {
      const res = await apiFetch(`${API}/whatsapp/status`)
      if (res.ok) {
        const data = await res.json()
        console.log("[WhatsApp debug]", data)
        setDebugInfo(`status: ${data.status}, qrCode: ${data.qrCode ? "oui (" + data.qrCode.substring(0, 30) + "...)" : "non"}`)
        setStatus(data.status)
        setQrCode(data.qrCode)
      } else {
        setDebugInfo(`Erreur HTTP ${res.status}`)
      }
    } catch (err) {
      setDebugInfo(`Erreur réseau: ${err.message}`)
    }
    setLoading(false)
  }

  // Polling toutes les 2 secondes quand on attend le QR
  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(fetchStatus, 2000)
  }

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  useEffect(() => {
    fetchStatus()
    return () => stopPolling()
  }, [])

  // Gérer le polling selon le statut
  useEffect(() => {
    if (status === "ready") {
      stopPolling()
      if (connecting) {
        toast.success("Bot WhatsApp connecté !")
        setConnecting(false)
      }
    }
    // Continuer le polling tant qu'on est en train de connecter
  }, [status])

  const handleConnect = async () => {
    setConnecting(true)
    setDebugInfo("Connexion en cours...")
    try {
      const res = await apiFetch(`${API}/whatsapp/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) {
        toast("Initialisation en cours...", { icon: "📱" })
        // Commencer le polling immédiatement
        startPolling()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.message || "Erreur lors de la connexion")
        setDebugInfo(`Erreur connect: ${JSON.stringify(data)}`)
        setConnecting(false)
      }
    } catch (err) {
      toast.error("Erreur réseau")
      setDebugInfo(`Erreur réseau: ${err.message}`)
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      const res = await apiFetch(`${API}/whatsapp/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) {
        setStatus("disconnected")
        setQrCode(null)
        setConnecting(false)
        stopPolling()
        toast.success("Bot déconnecté")
      }
    } catch {
      toast.error("Erreur réseau")
    }
  }

  const handleSendTest = async () => {
    if (!testPhone.trim() || !testMessage.trim()) return toast.error("Numéro et message requis")
    setSending(true)
    try {
      const res = await apiFetch(`${API}/whatsapp/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone, message: testMessage }),
      })
      const data = await res.json()
      if (res.ok) { toast.success("Message envoyé !"); setTestMessage("") }
      else toast.error(data.message)
    } catch {
      toast.error("Erreur réseau")
    } finally {
      setSending(false)
    }
  }

  const handleSendBulk = async () => {
    if (!bulkMessage.trim()) return toast.error("Message requis")
    setBulkSending(true)
    try {
      const res = await apiFetch(`${API}/whatsapp/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: bulkMessage, role: bulkRole }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`${data.sent} message(s) envoyé(s) sur ${data.total}`)
        if (data.failed > 0) toast(`${data.failed} échec(s)`, { icon: "⚠️" })
        setBulkMessage("")
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error("Erreur réseau")
    } finally {
      setBulkSending(false)
    }
  }

  const statusConfig = {
    disconnected: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Déconnecté", icon: <WifiOff className="w-5 h-5" /> },
    qr_pending:   { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "En attente du scan", icon: <RefreshCw className="w-5 h-5 animate-spin" /> },
    ready:        { color: "#22c55e", bg: "rgba(34,197,94,0.1)",  label: "Connecté", icon: <Wifi className="w-5 h-5" /> },
    error:        { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Erreur", icon: <WifiOff className="w-5 h-5" /> },
  }

  const sc = statusConfig[status] || statusConfig.disconnected

  if (loading) return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(37,211,102,0.1)" }}>
            <MessageCircle className="w-6 h-6" style={{ color: "#25d366" }} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-primary">Bot WhatsApp</h1>
            <p className="text-sm text-muted">Notifications automatiques via WhatsApp</p>
          </div>
        </div>

        {/* Status + Connection */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: sc.bg, color: sc.color }}>
                {sc.icon}
              </div>
              <div>
                <p className="font-bold text-primary text-sm">Statut du bot</p>
                <p className="text-sm font-bold" style={{ color: sc.color }}>{sc.label}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {status !== "ready" ? (
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60"
                  style={{ background: "#25d366" }}
                >
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                  {connecting ? "Connexion..." : "Connecter"}
                </button>
              ) : (
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all"
                  style={{ background: "#ef4444" }}
                >
                  <PowerOff className="w-4 h-4" />
                  Déconnecter
                </button>
              )}
              <button
                onClick={fetchStatus}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                style={{ background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Debug info */}
          {debugInfo && (
            <p className="text-xs font-mono p-2 rounded-lg" style={{ background: "var(--surface)", color: "var(--muted)" }}>
              {debugInfo}
            </p>
          )}

          {/* En attente du QR */}
          {connecting && !qrCode && status !== "ready" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#25d366" }} />
              <p className="text-sm text-muted">Génération du QR code en cours...</p>
            </div>
          )}

          {/* QR Code */}
          {qrCode && (
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-sm text-muted text-center">
                Scannez ce QR code avec WhatsApp sur votre téléphone
                <br />
                <span className="text-xs">(WhatsApp &gt; Menu &gt; Appareils connectés &gt; Connecter un appareil)</span>
              </p>
              <div className="p-4 bg-white rounded-2xl shadow-lg">
                <img src={qrCode} alt="QR Code WhatsApp" className="w-64 h-64" />
              </div>
            </div>
          )}

          {/* Info notifications auto */}
          {status === "ready" && (
            <div className="rounded-xl p-4" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <p className="text-sm font-bold" style={{ color: "#22c55e" }}>Notifications automatiques actives</p>
              <ul className="text-sm text-muted mt-2 space-y-1">
                <li>��� Message de bienvenue à chaque inscription</li>
                <li>• Rappel 2 jours avant la date de retour</li>
                <li>• Alerte en cas de retard de prêt</li>
              </ul>
            </div>
          )}
        </div>

        {/* Envoyer un message test */}
        {status === "ready" && (
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              <h2 className="font-black text-primary">Envoyer un message test</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Numéro (ex: 0701234567)"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="Message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="input"
              />
            </div>
            <button
              onClick={handleSendTest}
              disabled={sending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60"
              style={{ background: "#25d366" }}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Envoyer
            </button>
          </div>
        )}

        {/* Diffusion en masse */}
        {status === "ready" && (
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-black text-primary">Diffusion en masse</h2>
            </div>
            <p className="text-sm text-muted">
              Envoyez un message à tous les utilisateurs. Utilisez <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: "var(--surface)" }}>{"{nom}"}</code> pour personnaliser avec le nom.
            </p>
            <div className="flex gap-3 flex-wrap">
              <select
                value={bulkRole}
                onChange={(e) => setBulkRole(e.target.value)}
                className="input w-auto"
              >
                <option value="all">Tous les utilisateurs</option>
                <option value="student">Étudiants</option>
                <option value="employee">Employés</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            <textarea
              placeholder="Ex: Bonjour {nom}, la bibliothèque sera fermée demain..."
              value={bulkMessage}
              onChange={(e) => setBulkMessage(e.target.value)}
              rows={3}
              className="input w-full resize-none"
            />
            <button
              onClick={handleSendBulk}
              disabled={bulkSending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60"
              style={{ background: "#040848" }}
            >
              {bulkSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              {bulkSending ? "Envoi en cours..." : "Envoyer à tous"}
            </button>
          </div>
        )}

      </div>
      <Footer />
    </div>
  )
}
