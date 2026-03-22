import express from "express";
import { getAllFines, getUserFines, payFine, createManualFine, deleteFine } from "../controllers/fine.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect(["admin", "employee"]), getAllFines);
router.get("/user/:userId", protect(["admin", "employee"]), getUserFines);
router.put("/:id/pay", protect(["admin", "employee"]), payFine);
router.post("/", protect(["admin", "employee"]), createManualFine);
router.delete("/:id", protect(["admin"]), deleteFine);

export default router;
