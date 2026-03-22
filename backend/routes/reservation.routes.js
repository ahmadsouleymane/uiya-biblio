import express from "express";
import { createReservation, cancelReservation, getMyReservations, getBookQueue, getAllReservations } from "../controllers/reservation.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect(), createReservation);
router.delete("/:id", protect(), cancelReservation);
router.get("/me", protect(), getMyReservations);
router.get("/book/:bookId", protect(["admin", "employee"]), getBookQueue);
router.get("/", protect(["admin", "employee"]), getAllReservations);

export default router;
