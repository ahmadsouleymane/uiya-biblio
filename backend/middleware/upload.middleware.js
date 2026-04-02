import multer from "multer"
import path from "path"
import crypto from "crypto"

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, crypto.randomBytes(16).toString("hex") + ext)
  },
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true)
  else cb(new Error("Seules les images sont acceptées"), false)
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } })

// Upload PDF sur disque
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true)
  else cb(new Error("Seuls les fichiers PDF sont acceptés"), false)
}

export const uploadPdf = multer({ storage, fileFilter: pdfFilter, limits: { fileSize: 50 * 1024 * 1024 } })

// Upload CSV en mémoire (pas sur disque)
export const uploadCsv = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) cb(null, true);
    else cb(new Error("Seuls les fichiers CSV sont acceptés"), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }
})
