import express from "express"
import { checkIn, checkOut, getTodayPresence, getPresenceHistory } from "../controllers/presence.controller.js"
import { protect } from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/checkin", protect(["employee", "admin"]), checkIn)
router.put("/:id/checkout", protect(["employee", "admin"]), checkOut)
router.get("/today", protect(["employee", "admin"]), getTodayPresence)
router.get("/history", protect(["employee", "admin"]), getPresenceHistory)

export default router
