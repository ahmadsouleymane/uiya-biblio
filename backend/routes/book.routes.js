import express from "express"
import { addBook, getBooks, getBookById, getBookByIsbn, updateBook, deleteBook, getStats, getRecommendations, importBooksFromCsv, generateDescription, generateAllDescriptions, uploadBookPdf, deleteBookPdf } from "../controllers/book.controller.js"
import { protect } from "../middleware/auth.middleware.js"
import { uploadCsv, uploadPdf } from "../middleware/upload.middleware.js"

const router = express.Router()

router.post("/addBook", protect(["admin", "employee"]), addBook)
router.get("/", getBooks)
router.get("/stats", getStats)
router.get("/recommendations", getRecommendations)
router.get("/isbn/:isbn", getBookByIsbn)
router.get("/:id", getBookById)
router.put("/:id", protect(["admin", "employee"]), updateBook)
router.post("/:id/upload-pdf", protect(["admin", "employee"]), uploadPdf.single("pdf"), uploadBookPdf)
router.delete("/:id/pdf", protect(["admin", "employee"]), deleteBookPdf)
router.delete("/:id", protect(["admin"]), deleteBook)
router.post("/import-csv", protect(["admin"]), uploadCsv.single("file"), importBooksFromCsv)
router.post("/generate-description", protect(["admin", "employee"]), generateDescription)
router.post("/generate-all-descriptions", protect(["admin"]), generateAllDescriptions)

export default router
