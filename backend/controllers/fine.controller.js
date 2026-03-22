import Fine from "../models/fine.model.js";
import AuditLog from "../models/auditLog.model.js";

export const getAllFines = async (req, res) => {
  try {
    const { status, userId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.user = userId;

    const fines = await Fine.find(filter)
      .populate("user", "-password")
      .populate("loan")
      .populate("paidBy", "fullName")
      .sort({ createdAt: -1 });
    res.status(200).json(fines);
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getUserFines = async (req, res) => {
  try {
    const fines = await Fine.find({ user: req.params.userId })
      .populate("loan")
      .populate("paidBy", "fullName")
      .sort({ createdAt: -1 });
    res.status(200).json(fines);
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const payFine = async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine) return res.status(404).json({ message: "Amende introuvable" });
    if (fine.status === "paid") return res.status(400).json({ message: "Amende déjà payée" });

    fine.status = "paid";
    fine.paidAt = new Date();
    fine.paidBy = req.user._id;
    await fine.save();

    await AuditLog.create({
      user: req.user._id,
      action: "PAY_FINE",
      entity: "Fine",
      entityId: fine._id,
      details: { amount: fine.amount, userId: fine.user }
    });

    await fine.populate(["user", "loan", "paidBy"]);
    res.status(200).json(fine);
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const createManualFine = async (req, res) => {
  try {
    const { userId, loanId, amount, reason } = req.body;
    if (!userId || !amount) return res.status(400).json({ message: "userId et amount requis" });

    const fine = await Fine.create({ user: userId, loan: loanId, amount, reason });

    await AuditLog.create({
      user: req.user._id,
      action: "CREATE_FINE",
      entity: "Fine",
      entityId: fine._id,
      details: { amount, userId, reason }
    });

    await fine.populate(["user", "loan"]);
    res.status(201).json(fine);
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const deleteFine = async (req, res) => {
  try {
    const fine = await Fine.findByIdAndDelete(req.params.id);
    if (!fine) return res.status(404).json({ message: "Amende introuvable" });

    await AuditLog.create({
      user: req.user._id,
      action: "DELETE_FINE",
      entity: "Fine",
      entityId: req.params.id,
      details: { amount: fine.amount, userId: fine.user }
    });

    res.status(200).json({ message: "Amende supprimée" });
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
