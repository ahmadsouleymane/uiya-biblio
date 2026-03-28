import express from "express";
import { getAdminStats, exportData, exportPdf, getEmployeeBookRanking } from "../controllers/stats.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect(["admin"]), getAdminStats);
router.get("/export", protect(["admin"]), exportData);
router.get("/export-pdf", protect(["admin"]), exportPdf);
router.get("/employee-ranking", protect(["admin"]), getEmployeeBookRanking);

export default router;
