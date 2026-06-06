import Presence from "../models/presence.model.js";
import User from "../models/user.model.js";

export const checkIn = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId requis" });

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const presence = await Presence.create({ user: userId, scannedBy: req.user._id });
    await presence.populate(["user", { path: "scannedBy", select: "fullName" }]);

    res.status(201).json(presence);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const checkOut = async (req, res) => {
  try {
    const presence = await Presence.findById(req.params.id);
    if (!presence) return res.status(404).json({ message: "Présence introuvable" });
    if (presence.checkOut) return res.status(400).json({ message: "Sortie déjà enregistrée" });

    presence.checkOut = new Date();
    await presence.save();
    await presence.populate(["user", { path: "scannedBy", select: "fullName" }]);

    res.status(200).json(presence);
  } catch (e) {
    console.error("[presence] error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getTodayPresence = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const presences = await Presence.find({ checkIn: { $gte: start, $lte: end } })
      .populate("user", "-password")
      .populate("scannedBy", "fullName")
      .sort({ checkIn: -1 });

    res.status(200).json(presences);
  } catch (e) {
    console.error("[presence] error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getPresenceHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [presences, total] = await Promise.all([
      Presence.find()
        .populate("user", "-password")
        .populate("scannedBy", "fullName")
        .sort({ checkIn: -1 })
        .skip(skip)
        .limit(limit),
      Presence.countDocuments(),
    ]);

    res.status(200).json({ presences, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error("[presence] error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
