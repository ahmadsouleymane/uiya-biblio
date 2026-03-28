import {
  getWhatsAppStatus,
  initWhatsApp,
  destroyWhatsApp,
  sendCustomWhatsApp,
  checkWhatsAppNumber,
} from "../utils/whatsapp.js";
import User from "../models/user.model.js";

export const getStatus = async (req, res) => {
  try {
    const { status, qrCode } = getWhatsAppStatus();
    res.status(200).json({ status, qrCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const connect = async (req, res) => {
  try {
    await initWhatsApp();
    res.status(200).json({ message: "Initialisation du bot WhatsApp en cours..." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de l'initialisation" });
  }
};

export const disconnect = async (req, res) => {
  try {
    destroyWhatsApp();
    res.status(200).json({ message: "Bot WhatsApp déconnecté" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la déconnexion" });
  }
};

export const sendTestMessage = async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ message: "Numéro et message requis" });
    }
    const sent = await sendCustomWhatsApp(phone, message);
    if (sent) {
      res.status(200).json({ message: "Message envoyé avec succès" });
    } else {
      res.status(400).json({ message: "Échec de l'envoi — le bot est-il connecté ?" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const checkPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "Numéro requis" });

    const result = await checkWhatsAppNumber(phone);

    if (result === null) {
      // Bot non connecté — on ne peut pas vérifier
      return res.status(503).json({ isWhatsApp: null, message: "Le service de vérification WhatsApp est indisponible. Veuillez réessayer plus tard." });
    }

    res.status(200).json({ isWhatsApp: result });
  } catch (err) {
    console.error(err);
    res.status(503).json({ isWhatsApp: null, message: "Erreur de vérification WhatsApp" });
  }
};

export const sendBulkMessage = async (req, res) => {
  try {
    const { message, role } = req.body;
    if (!message) return res.status(400).json({ message: "Message requis" });

    const filter = {};
    if (role && role !== "all") filter.role = role;

    const users = await User.find(filter).select("phone fullName");
    let sent = 0;
    let failed = 0;

    for (const user of users) {
      if (!user.phone) { failed++; continue; }
      const personalMessage = message.replace("{nom}", user.fullName);
      const ok = await sendCustomWhatsApp(user.phone, personalMessage);
      if (ok) sent++;
      else failed++;
      await new Promise((r) => setTimeout(r, 1500));
    }

    res.status(200).json({ sent, failed, total: users.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
