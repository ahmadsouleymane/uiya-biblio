import AuditLog from "../models/auditLog.model.js";

export const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const { action, entity } = req.query;

    const filter = {};
    if (action) filter.action = { $regex: action, $options: "i" };
    if (entity) filter.entity = entity;

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate("user", "fullName email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error("[audit] error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
