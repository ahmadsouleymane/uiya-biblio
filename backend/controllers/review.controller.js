import Review from "../models/review.model.js";

export const upsertReview = async (req, res) => {
  try {
    const { bookId, rating, comment } = req.body;
    if (!bookId || !rating) return res.status(400).json({ message: "bookId et rating requis" });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: "La note doit être entre 1 et 5" });

    const review = await Review.findOneAndUpdate(
      { user: req.user._id, book: bookId },
      { rating, comment, createdAt: new Date() },
      { upsert: true, new: true }
    ).populate("user", "fullName");

    res.status(200).json(review);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getBookReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ book: req.params.bookId })
      .populate("user", "fullName department")
      .sort({ createdAt: -1 });

    const avg = reviews.length
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

    res.status(200).json({ reviews, average: avg, total: reviews.length });
  } catch (e) {
    console.error("[review] error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Avis introuvable" });

    const isOwner = review.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") return res.status(403).json({ message: "Non autorisé" });

    await review.deleteOne();
    res.status(200).json({ message: "Avis supprimé" });
  } catch (e) {
    console.error("[review] error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
