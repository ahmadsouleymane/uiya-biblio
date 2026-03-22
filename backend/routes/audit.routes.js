import express from "express";
import { getAuditLogs } from "../controllers/audit.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect(["admin"]), getAuditLogs);

export default router;
