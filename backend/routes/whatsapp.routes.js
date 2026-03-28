import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getStatus,
  connect,
  disconnect,
  sendTestMessage,
  sendBulkMessage,
} from "../controllers/whatsapp.controller.js";

const router = Router();

// Toutes les routes nécessitent un admin
router.get("/status", protect(["admin"]), getStatus);
router.post("/connect", protect(["admin"]), connect);
router.post("/disconnect", protect(["admin"]), disconnect);
router.post("/test", protect(["admin"]), sendTestMessage);
router.post("/bulk", protect(["admin"]), sendBulkMessage);

export default router;
