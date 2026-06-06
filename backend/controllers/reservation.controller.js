import Reservation from "../models/reservation.model.js";
import Book from "../models/book.model.js";

export const createReservation = async (req, res) => {
  try {
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ message: "bookId requis" });

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Livre introuvable" });
    if (book.availableCopies > 0) return res.status(400).json({ message: "Ce livre est disponible, vous pouvez l'emprunter directement" });

    const existing = await Reservation.findOne({ user: req.user._id, book: bookId, status: { $in: ['pending', 'available'] } });
    if (existing) return res.status(400).json({ message: "Vous avez déjà une réservation active pour ce livre" });

    const reservation = await Reservation.create({ user: req.user._id, book: bookId });
    await reservation.populate(["user", "book"]);
    res.status(201).json(reservation);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Réservation introuvable" });

    const isOwner = reservation.user.toString() === req.user._id.toString();
    const isStaff = ["admin", "employee"].includes(req.user.role);
    if (!isOwner && !isStaff) return res.status(403).json({ message: "Non autorisé" });

    reservation.status = "cancelled";
    await reservation.save();
    res.status(200).json({ message: "Réservation annulée" });
  } catch (e) {
    console.error("[reservation] error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id })
      .populate("book")
      .sort({ createdAt: -1 });
    res.status(200).json(reservations);
  } catch (e) {
    console.error("[reservation] error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getBookQueue = async (req, res) => {
  try {
    const reservations = await Reservation.find({ book: req.params.bookId, status: { $in: ['pending', 'available'] } })
      .populate("user", "-password")
      .sort({ createdAt: 1 });
    res.status(200).json(reservations);
  } catch (e) {
    console.error("[reservation] error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getAllReservations = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const reservations = await Reservation.find(filter)
      .populate("user", "-password")
      .populate("book")
      .sort({ createdAt: -1 });
    res.status(200).json(reservations);
  } catch (e) {
    console.error("[reservation] error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
