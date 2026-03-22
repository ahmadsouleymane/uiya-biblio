import express from "express";
import { getMyNotifications, markRead, markAllRead } from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/me", protect(["student", "employee", "admin"]), getMyNotifications);
router.put("/read-all", protect(["student", "employee", "admin"]), markAllRead);
router.put("/:id/read", protect(["student", "employee", "admin"]), markRead);

export default router;
