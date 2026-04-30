import express from "express"
import { fileURLToPath } from "url"
import path from "path"

import fs from "fs"
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, "uploads")
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

import connectDB from "./config/db.js"
import dotenv from "dotenv"
import userRoutes from "./routes/user.routes.js"
import bookRoutes from "./routes/book.routes.js"
import loanRoutes from "./routes/loan.routes.js"
import presenceRoutes from "./routes/presence.routes.js"
import statsRoutes from "./routes/stats.routes.js"
import eventRoutes from "./routes/event.routes.js"
import reviewRoutes from "./routes/review.routes.js"
import settingsRoutes from "./routes/settings.routes.js"
import auditRoutes from "./routes/audit.routes.js"
import notificationRoutes from "./routes/notification.routes.js"
import categoryRoutes from "./routes/category.routes.js"
import reservationRoutes from "./routes/reservation.routes.js"
import fineRoutes from "./routes/fine.routes.js"
import whatsappRoutes from "./routes/whatsapp.routes.js"
import cors from "cors"
import cookieParser from "cookie-parser"
import morgan from "morgan"
import rateLimit from "express-rate-limit"
import { startScheduler } from "./utils/scheduler.js"

dotenv.config()

const port = 7080
const app = express()
connectDB()

// Logging HTTP
app.use(morgan("dev"))

// CORS — autoriser plusieurs origines (dev + prod)
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  "https://uiya-biblio.vercel.app",
  "http://localhost:5173",
].filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    if (allowedOrigins.includes(origin) || /\.ngrok-free\.app$/.test(origin)) return cb(null, true)
    return cb(new Error("Origin non autorisée"))
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
}))

// Rate limiting sur les endpoints d'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: "Trop de tentatives, réessaie dans 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(express.json({ limit: "10mb" }))
app.use(cookieParser())
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Routes
app.use("/user/login", authLimiter)
app.use("/user/addUser", authLimiter)

app.use("/user", userRoutes)
app.use("/book", bookRoutes)
app.use("/loan", loanRoutes)
app.use("/presence", presenceRoutes)
app.use("/stats", statsRoutes)
app.use("/event", eventRoutes)
app.use("/review", reviewRoutes)
app.use("/settings", settingsRoutes)
app.use("/audit", auditRoutes)
app.use("/notification", notificationRoutes)
app.use("/category", categoryRoutes)
app.use("/reservation", reservationRoutes)
app.use("/fine", fineRoutes)
app.use("/whatsapp", whatsappRoutes)

// Health check — uptime monitoring
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
})

// Middleware global d'erreurs (multer, json parser, etc.)
app.use((err, _req, res, next) => {
  console.error("[ErrorHandler]", err?.message || err)
  if (res.headersSent) return next(err)
  if (err?.code === "LIMIT_FILE_SIZE") return res.status(413).json({ message: "Fichier trop volumineux" })
  if (err?.message && /seuls|acceptée|Origin/i.test(err.message)) return res.status(400).json({ message: err.message })
  res.status(500).json({ message: "Erreur serveur" })
})

startScheduler()

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
