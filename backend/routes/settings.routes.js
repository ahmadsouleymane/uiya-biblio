import express from "express";
import { getSettings, updateSettings } from "../controllers/settings.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getSettings);
router.put("/", protect(["admin"]), updateSettings);

export default router;
