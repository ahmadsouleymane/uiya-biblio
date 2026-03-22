import Notification from "../models/notification.model.js";

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.status(200).json(notifications);
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true }
    );
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
