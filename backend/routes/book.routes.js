import express from "express"
import multer from "multer"
import { addBook, getBooks, getBookById, getBookByIsbn, updateBook, deleteBook, getStats, getRecommendations, importBooksFromCsv, generateDescription, generateAllDescriptions, uploadBookPdf, deleteBookPdf } from "../controllers/book.controller.js"
import { protect } from "../middleware/auth.middleware.js"
import { uploadCsv, uploadPdf } from "../middleware/upload.middleware.js"

const router = express.Router()

// Wrapper pour gérer les erreurs multer proprement
const handleUpload = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ message: "Fichier trop volumineux" })
      return res.status(400).json({ message: `Erreur upload: ${err.message}` })
    }
    if (err) return res.status(400).json({ message: err.message })
    next()
  })
}

// Routes statiques AVANT les routes dynamiques /:id
router.post("/addBook", protect(["admin", "employee"]), addBook)
router.get("/", getBooks)
router.get("/stats", getStats)
router.get("/recommendations", getRecommendations)
router.get("/isbn/:isbn", getBookByIsbn)
router.post("/import-csv", protect(["admin"]), uploadCsv.single("file"), importBooksFromCsv)
router.post("/generate-description", protect(["admin", "employee"]), generateDescription)
router.post("/generate-all-descriptions", protect(["admin"]), generateAllDescriptions)

// Routes dynamiques /:id — les plus spécifiques d'abord
router.post("/:id/upload-pdf", protect(["admin", "employee"]), handleUpload(uploadPdf.single("pdf")), uploadBookPdf)
router.delete("/:id/pdf", protect(["admin", "employee"]), deleteBookPdf)
router.get("/:id", getBookById)
router.put("/:id", protect(["admin", "employee"]), updateBook)
router.delete("/:id", protect(["admin"]), deleteBook)

export default router
