import express from "express";
import { getCategories, addCategory, updateCategory, deleteCategory } from "../controllers/category.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getCategories);
router.post("/", protect(["admin"]), addCategory);
router.put("/:id", protect(["admin"]), updateCategory);
router.delete("/:id", protect(["admin"]), deleteCategory);

export default router;
