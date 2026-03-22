import User from "../models/user.model.js";
import Fine from "../models/fine.model.js";
import AuditLog from "../models/auditLog.model.js";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendResetPasswordEmail } from "../utils/email.js";
import { parse } from "csv-parse/sync";

const signAndSendToken = (res, user) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const addUser = async (req, res) => {
  try {
    const { fullName, email, phone, department, year, password } = req.body;

    if (!fullName?.trim()) return res.status(400).json({ message: "Le nom complet est requis" });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Email invalide" });
    if (!phone?.trim()) return res.status(400).json({ message: "Le téléphone est requis" });
    if (!password || password.length < 6) return res.status(400).json({ message: "Le mot de passe doit faire au moins 6 caractères" });
    if (!department?.trim()) return res.status(400).json({ message: "Le département est requis" });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName,
      email,
      phone,
      department,
      year,
      password: hashedPassword,
    });

    try {
      const qrDataUrl = await QRCode.toDataURL(user._id.toString());
      user.qrCode = qrDataUrl;
      await user.save();
    } catch (err) {
      console.error("Erreur QR code:", err);
    }

    signAndSendToken(res, user);

    const userWithoutPassword = { ...user._doc };
    delete userWithoutPassword.password;

    res.status(201).json(userWithoutPassword);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la création de l'utilisateur" });
  }
};

export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone?.trim() || !password) return res.status(400).json({ message: "Téléphone et mot de passe requis" });

    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ message: "Identifiants incorrects" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Identifiants incorrects" });

    signAndSendToken(res, user);

    const userWithoutPassword = { ...user._doc };
    delete userWithoutPassword.password;

    res.status(200).json(userWithoutPassword);
  } catch (err) {
    console.error("Erreur login:", err);
    res.status(500).json({ message: "Erreur lors de la connexion" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Déconnexion réussie" });
};

export const me = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Non authentifié" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password").populate("favorites", "title cover author");

    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    res.status(200).json(user);
  } catch (err) {
    console.error("Erreur me:", err);
    res.status(401).json({ message: "Token invalide" });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { fullName, phone, department, year } = req.body;
    const update = {};
    if (fullName !== undefined) update.fullName = fullName;
    if (phone !== undefined) update.phone = phone;
    if (department !== undefined) update.department = department;
    if (year !== undefined) update.year = year;

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["student", "employee", "admin"].includes(role)) {
      return res.status(400).json({ message: "Rôle invalide" });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    await AuditLog.create({
      user: req.user._id,
      action: "CHANGE_ROLE",
      entity: "User",
      entityId: req.params.id,
      details: { newRole: role, userName: user.fullName }
    });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: "Impossible de supprimer son propre compte" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    await AuditLog.create({
      user: req.user._id,
      action: "DELETE_USER",
      entity: "User",
      entityId: req.params.id,
      details: { userName: user.fullName, email: user.email }
    });

    res.status(200).json({ message: "Utilisateur supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── Reset mot de passe ────────────────────────────────────────────────────

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requis" });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Ne pas révéler si l'email existe ou non
    if (!user) return res.status(200).json({ message: "Si cet email existe, un lien a été envoyé." });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reinitialiser-mdp/${token}`;

    try {
      await sendResetPasswordEmail(user.email, resetUrl);
    } catch (emailErr) {
      console.error("Erreur envoi email:", emailErr);
      // Ne pas bloquer si l'email échoue — log seulement
    }

    res.status(200).json({ message: "Si cet email existe, un lien a été envoyé." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit faire au moins 6 caractères" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) return res.status(400).json({ message: "Lien invalide ou expiré" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── Favoris ──────────────────────────────────────────────────────────────

export const addFavorite = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { favorites: req.params.bookId } },
      { new: true }
    ).select("-password").populate("favorites", "title cover author");

    res.status(200).json(user.favorites);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { favorites: req.params.bookId } },
      { new: true }
    ).select("-password").populate("favorites", "title cover author");

    res.status(200).json(user.favorites);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("favorites")
      .populate("favorites");
    res.status(200).json(user.favorites || []);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── Import CSV utilisateurs ───────────────────────────────────────────────

export const importUsersFromCsv = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Fichier CSV requis" });

    const records = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    let inserted = 0, errors = [];

    for (const row of records) {
      try {
        const { fullName, email, phone, password, department, year, role } = row;
        if (!fullName || !email || !phone || !password || !department) {
          errors.push({ email, reason: "Champs obligatoires manquants" });
          continue;
        }

        const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
        if (exists) { errors.push({ email, reason: "Email ou téléphone déjà utilisé" }); continue; }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const validRole = ["student", "employee", "admin"].includes(role) ? role : "student";

        const user = await User.create({
          fullName, email: email.toLowerCase(), phone,
          password: hashedPassword, department, year: year || "1",
          role: validRole,
        });

        try {
          const qrDataUrl = await QRCode.toDataURL(user._id.toString());
          user.qrCode = qrDataUrl;
          await user.save();
        } catch { /* ignore QR errors */ }

        inserted++;
      } catch (err) {
        errors.push({ email: row.email, reason: err.message });
      }
    }

    await AuditLog.create({
      user: req.user._id,
      action: "IMPORT_USERS_CSV",
      entity: "User",
      details: { inserted, errors: errors.length }
    });

    res.status(200).json({ inserted, errors });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Erreur lors de l'import CSV" });
  }
};

// ─── Stats utilisateur ────────────────────────────────────────────────────

export const getUserStats = async (req, res) => {
  try {
    const Loan = (await import("../models/loan.model.js")).default;
    const loans = await Loan.find({ user: req.params.userId }).populate("book", "category title");

    const returned = loans.filter(l => l.status === "returned");
    const active = loans.filter(l => ["borrowed", "late"].includes(l.status));
    const late = loans.filter(l => l.status === "late");

    const categoryCounts = {};
    for (const loan of loans) {
      if (loan.book?.category) {
        categoryCounts[loan.book.category] = (categoryCounts[loan.book.category] || 0) + 1;
      }
    }
    const favoriteCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Emprunts par mois (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentLoans = loans.filter(l => new Date(l.borrowDate) >= sixMonthsAgo);

    const byMonth = {};
    for (const loan of recentLoans) {
      const key = new Date(loan.borrowDate).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      byMonth[key] = (byMonth[key] || 0) + 1;
    }

    const pendingFines = await Fine.countDocuments({ user: req.params.userId, status: "pending" });
    const totalFineAmount = await Fine.aggregate([
      { $match: { user: req.params.userId, status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.status(200).json({
      totalLoans: loans.length,
      returnedLoans: returned.length,
      activeLoans: active.length,
      lateLoans: late.length,
      favoriteCategory,
      byMonth,
      pendingFines,
      totalFineAmount: totalFineAmount[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
