import express from "express"
import { getEvents, addEvent, deleteEvent, registerForEvent, unregisterFromEvent, getRegistrations } from "../controllers/event.controller.js"
import { protect } from "../middleware/auth.middleware.js"
import { upload } from "../middleware/upload.middleware.js"

const router = express.Router()

router.get("/", getEvents)
router.post("/", protect(["admin"]), upload.single("poster"), addEvent)
router.delete("/:id", protect(["admin"]), deleteEvent)
router.post("/:id/register", protect(["student", "employee", "admin"]), registerForEvent)
router.delete("/:id/register", protect(["student", "employee", "admin"]), unregisterFromEvent)
router.get("/:id/registrations", protect(["admin"]), getRegistrations)

export default router
