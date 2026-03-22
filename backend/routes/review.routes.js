import express from "express";
import { upsertReview, getBookReviews, deleteReview } from "../controllers/review.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect(), upsertReview);
router.get("/book/:bookId", getBookReviews);
router.delete("/:id", protect(), deleteReview);

export default router;
