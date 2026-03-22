import Loan from "../models/loan.model.js";
import Book from "../models/book.model.js";
import User from "../models/user.model.js";
import Presence from "../models/presence.model.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export const getAdminStats = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      loansByMonthRaw,
      topBooksRaw,
      userRolesRaw,
      booksPerCatRaw,
      totalBooks,
      availableBooks,
      totalUsers,
      activeLoans,
      lateLoans,
      totalLoansAllTime,
      todayPresence,
    ] = await Promise.all([
      // Emprunts par mois (6 derniers mois)
      Loan.aggregate([
        { $match: { borrowDate: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: "$borrowDate" }, month: { $month: "$borrowDate" } },
            total: { $sum: 1 },
            retards: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // Top 5 livres les plus empruntés
      Loan.aggregate([
        { $group: { _id: "$book", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: "books", localField: "_id", foreignField: "_id", as: "book" } },
        { $unwind: "$book" },
        { $project: { title: "$book.title", cover: "$book.cover", count: 1, _id: 0 } },
      ]),

      // Répartition des rôles utilisateurs
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),

      // Livres par catégorie (top 8)
      Book.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      // Stats simples
      Book.countDocuments(),
      Book.aggregate([{ $group: { _id: null, total: { $sum: "$availableCopies" } } }]),
      User.countDocuments(),
      Loan.countDocuments({ status: { $in: ["borrowed", "late"] } }),
      Loan.countDocuments({ status: "late" }),
      Loan.countDocuments(),
      Presence.countDocuments({ checkIn: { $gte: todayStart, $lte: todayEnd } }),
    ]);

    // Construire le tableau des 6 derniers mois (même si certains mois ont 0 emprunt)
    const now = new Date();
    const loansByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const found = loansByMonthRaw.find(
        (l) => l._id.year === d.getFullYear() && l._id.month === d.getMonth() + 1
      );
      loansByMonth.push({
        month: MONTHS_FR[d.getMonth()],
        emprunts: found?.total || 0,
        retards: found?.retards || 0,
      });
    }

    const roleLabels = { student: "Étudiants", employee: "Employés", admin: "Admins" };
    const roleColors = { student: "#2563eb", employee: "#7c3aed", admin: "#e11d48" };

    res.status(200).json({
      // Stat cards
      totalBooks,
      availableBooks: availableBooks[0]?.total || 0,
      totalUsers,
      activeLoans,
      lateLoans,
      totalLoansAllTime,
      todayPresence,
      lateRate: totalLoansAllTime > 0 ? Math.round((lateLoans / totalLoansAllTime) * 100) : 0,

      // Graphiques
      loansByMonth,
      topBooks: topBooksRaw,
      userRoles: userRolesRaw.map((r) => ({
        name: roleLabels[r._id] || r._id,
        value: r.count,
        color: roleColors[r._id] || "#94a3b8",
      })),
      booksPerCategory: booksPerCatRaw.map((b) => ({
        name: b._id?.length > 16 ? b._id.slice(0, 16) + "…" : (b._id || "Autre"),
        value: b.count,
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ── Helpers partagés ────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "";
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";
const fmtDuration = (msec) => {
  if (!msec || msec < 0) return "";
  const totalMin = Math.round(msec / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m} min`;
};

const roleLabel = (r) =>
  r === "student" ? "Étudiant" : r === "employee" ? "Employé" : r === "admin" ? "Admin" : r ?? "";

const periodLabel = (from, to) => {
  if (from && to) return `Du ${fmtDate(from)} au ${fmtDate(to)}`;
  if (from)       return `Depuis le ${fmtDate(from)}`;
  if (to)         return `Jusqu'au ${fmtDate(to)}`;
  return "Toute la période";
};

const buildDateFilter = (from, to, field) => {
  const filter = {};
  if (from || to) {
    filter[field] = {};
    if (from) filter[field].$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter[field].$lte = end;
    }
  }
  return filter;
};

// ── Export Excel (.xlsx) ─────────────────────────────────────────────
export const exportData = async (req, res) => {
  try {
    const { type, from, to } = req.query;
    const dateStr = new Date().toISOString().slice(0, 10);

    if (!["loans", "users", "presence", "books"].includes(type)) {
      return res.status(400).json({ message: "Type invalide. Valeurs : loans, users, presence, books" });
    }

    // ── Palette ───────────────────────────────────────────────────
    const C = {
      primary:    "FF040848",
      white:      "FFFFFFFF",
      metaBg:     "FFE8ECFF",
      lateRow:    "FFFEE2E2",
      lateText:   "FF991B1B",
      borrowRow:  "FFDBEAFE",
      borrowText: "FF1E40AF",
      returnRow:  "FFD1FAE5",
      returnText: "FF065F46",
      adminRow:   "FFFCE7F3",
      empRow:     "FFEDE9FE",
      catSep:     "FFE2E8F0",
      sepText:    "FF334155",
      sumHead:    "FF1E293B",
      sumAlt:     "FFF8FAFC",
      borderCol:  "FFD1D5DB",
      dark:       "FF0F172A",
    };

    const fl  = (a) => ({ type: "pattern", pattern: "solid", fgColor: { argb: a } });
    const bd  = { style: "thin", color: { argb: C.borderCol } };
    const bdr = { top: bd, bottom: bd, left: bd, right: bd };
    const mkFont = ({ bold = false, italic = false, size = 10, color = C.dark } = {}) => ({
      name: "Calibri", size, bold, italic, color: { argb: color },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = "Bibliothèque UIYA";
    wb.created = new Date();

    // Initialise la feuille avec titre (ligne 1), méta (ligne 2), spacer (ligne 3), en-têtes (ligne 4)
    const HEADER_ROW = 4;
    const DATA_START = 5;

    const initSheet = (sheetName, title, period, count, headers, colWidths) => {
      const ws = wb.addWorksheet(sheetName);
      colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
      const numCols = headers.length;

      // Ligne 1 : titre fusionné
      ws.mergeCells(1, 1, 1, numCols);
      const tr = ws.getRow(1);
      tr.height = 34;
      const tc = tr.getCell(1);
      tc.value     = title;
      tc.font      = mkFont({ bold: true, size: 14, color: C.white });
      tc.fill      = fl(C.primary);
      tc.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

      // Ligne 2 : métadonnées
      const mr = ws.getRow(2);
      mr.height = 20;
      const metaVals = [
        `Exporté le ${fmtDate(new Date())}`,
        `Période : ${period}`,
        `${count} enregistrement${count !== 1 ? "s" : ""}`,
      ];
      for (let c = 1; c <= numCols; c++) {
        const mc = mr.getCell(c);
        mc.fill = fl(C.metaBg);
        if (c <= 3) {
          mc.value     = metaVals[c - 1];
          mc.font      = mkFont({ italic: true, color: C.primary });
          mc.alignment = { vertical: "middle", indent: c === 1 ? 1 : 0 };
        }
      }

      // Ligne 3 : spacer
      ws.getRow(3).height = 5;
      for (let c = 1; c <= numCols; c++) ws.getRow(3).getCell(c).fill = fl("FFF4F6FF");

      // Ligne 4 : en-têtes
      const hr = ws.getRow(HEADER_ROW);
      hr.height = 24;
      headers.forEach((h, i) => {
        const hc     = hr.getCell(i + 1);
        hc.value     = h;
        hc.font      = mkFont({ bold: true, color: C.white });
        hc.fill      = fl(C.primary);
        hc.alignment = { vertical: "middle", horizontal: "center" };
        hc.border    = bdr;
      });

      // Figer les lignes d'en-tête
      ws.views = [{ state: "frozen", ySplit: HEADER_ROW }];
      return ws;
    };

    // Ajoute une ligne de données colorée
    const addRow = (ws, rowNum, values, bgArgb = C.white, textArgb = C.dark) => {
      const row = ws.getRow(rowNum);
      row.height = 18;
      values.forEach((v, i) => {
        const c     = row.getCell(i + 1);
        c.value     = v ?? "";
        c.fill      = fl(bgArgb);
        c.font      = mkFont({ color: textArgb });
        c.alignment = { vertical: "middle", indent: i === 0 ? 1 : 0 };
        c.border    = bdr;
      });
    };

    // Ajoute la section récapitulatif en bas
    const addSummary = (ws, startRow, summaryRows, numCols) => {
      let r = startRow + 1; // ligne vide de séparation

      // En-tête récap
      const sh = ws.getRow(r);
      sh.height = 22;
      sh.getCell(1).value     = "RÉCAPITULATIF";
      sh.getCell(1).font      = mkFont({ bold: true, color: C.white, size: 11 });
      sh.getCell(1).fill      = fl(C.sumHead);
      sh.getCell(1).alignment = { vertical: "middle", indent: 1 };
      for (let c = 2; c <= numCols; c++) sh.getCell(c).fill = fl(C.sumHead);
      r++;

      summaryRows.forEach(([label, value], i) => {
        const isTotal = label === "TOTAL";
        const bgArgb  = isTotal ? C.primary : (i % 2 === 0 ? C.sumAlt : C.white);
        const textCol = isTotal ? C.white : C.dark;
        const wr      = ws.getRow(r);
        wr.height     = 20;

        const lc     = wr.getCell(1);
        lc.value     = label;
        lc.font      = mkFont({ bold: isTotal, color: textCol });
        lc.fill      = fl(bgArgb);
        lc.alignment = { vertical: "middle", indent: 2 };
        lc.border    = bdr;

        const vc     = wr.getCell(2);
        vc.value     = value;
        vc.font      = mkFont({ bold: true, color: textCol, size: isTotal ? 11 : 10 });
        vc.fill      = fl(bgArgb);
        vc.alignment = { vertical: "middle" };
        vc.border    = bdr;

        for (let c = 3; c <= numCols; c++) {
          wr.getCell(c).fill   = fl(bgArgb);
          wr.getCell(c).border = bdr;
        }
        r++;
      });
    };

    const period = periodLabel(from, to);
    let filename = "";

    // ── EMPRUNTS ─────────────────────────────────────────────────────
    if (type === "loans") {
      const filter = buildDateFilter(from, to, "borrowDate");
      const raw = await Loan.find(filter)
        .populate("user", "fullName email phone department year")
        .populate("book", "title isbn author")
        .lean();

      const statusOrder = { late: 0, borrowed: 1, returned: 2 };
      const loans = raw.sort((a, b) =>
        (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9) ||
        new Date(b.borrowDate) - new Date(a.borrowDate)
      );

      const headers   = ["N°", "Lecteur", "Email", "Téléphone", "Département", "Année", "Titre du livre", "ISBN", "Date emprunt", "Retour prévu", "Retour réel", "Statut", "Jours retard"];
      const colWidths = [5, 22, 26, 14, 16, 8, 30, 16, 12, 12, 12, 12, 13];

      const ws  = initSheet("Emprunts", "BIBLIOTHÈQUE UIYA — EMPRUNTS", period, loans.length, headers, colWidths);
      const now = new Date();

      loans.forEach((l, i) => {
        const due      = new Date(l.borrowDate);
        due.setDate(due.getDate() + 14);
        const isLate   = l.status === "late" || (l.status === "borrowed" && now > due);
        const daysLate = isLate ? Math.floor((now - due) / 86400000) : "";
        const statusStr = l.status === "late" ? "En retard" : l.status === "borrowed" ? "En cours" : "Retourné";
        const [bg, fg]  = l.status === "late"
          ? [C.lateRow,   C.lateText]
          : l.status === "borrowed"
            ? [C.borrowRow, C.borrowText]
            : [C.returnRow, C.returnText];

        addRow(ws, DATA_START + i, [
          i + 1, l.user?.fullName ?? "", l.user?.email ?? "", l.user?.phone ?? "",
          l.user?.department ?? "", l.user?.year ?? "", l.book?.title ?? "", l.book?.isbn ?? "",
          fmtDate(l.borrowDate), fmtDate(due),
          l.returnDate ? fmtDate(l.returnDate) : "", statusStr, daysLate,
        ], bg, fg);
      });

      const nbLate     = loans.filter(l => l.status === "late").length;
      const nbBorrowed = loans.filter(l => l.status === "borrowed").length;
      const nbReturned = loans.filter(l => l.status === "returned").length;
      addSummary(ws, DATA_START + loans.length, [
        ["En retard", nbLate], ["En cours", nbBorrowed], ["Retournés", nbReturned], ["TOTAL", loans.length],
      ], headers.length);

      filename = `emprunts_${dateStr}.xlsx`;

    // ── UTILISATEURS ─────────────────────────────────────────────────
    } else if (type === "users") {
      const filter = buildDateFilter(from, to, "createdAt");
      const raw    = await User.find(filter).select("-password").lean();

      const roleOrder = { admin: 0, employee: 1, student: 2 };
      const users = raw.sort((a, b) =>
        (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9) ||
        (a.fullName ?? "").localeCompare(b.fullName ?? "", "fr")
      );

      const headers   = ["N°", "Nom complet", "Email", "Téléphone", "Département", "Année", "Rôle", "Date inscription"];
      const colWidths = [5, 24, 28, 14, 18, 8, 12, 14];

      const ws = initSheet("Utilisateurs", "BIBLIOTHÈQUE UIYA — UTILISATEURS", period, users.length, headers, colWidths);

      users.forEach((u, i) => {
        const bg = u.role === "admin" ? C.adminRow : u.role === "employee" ? C.empRow : C.white;
        addRow(ws, DATA_START + i, [
          i + 1, u.fullName ?? "", u.email ?? "", u.phone ?? "",
          u.department ?? "", u.year ?? "", roleLabel(u.role), fmtDate(u.createdAt),
        ], bg);
      });

      const nbAdmins    = users.filter(u => u.role === "admin").length;
      const nbEmployees = users.filter(u => u.role === "employee").length;
      const nbStudents  = users.filter(u => u.role === "student").length;
      addSummary(ws, DATA_START + users.length, [
        ["Admins", nbAdmins], ["Employés", nbEmployees], ["Étudiants", nbStudents], ["TOTAL", users.length],
      ], headers.length);

      filename = `utilisateurs_${dateStr}.xlsx`;

    // ── PRÉSENCES ─────────────────────────────────────────────────────
    } else if (type === "presence") {
      const filter = buildDateFilter(from, to, "checkIn");
      const raw    = await Presence.find(filter)
        .populate("user", "fullName email phone department role")
        .lean();

      const presences = raw.sort((a, b) =>
        new Date(b.checkIn) - new Date(a.checkIn) ||
        (a.user?.fullName ?? "").localeCompare(b.user?.fullName ?? "", "fr")
      );

      const headers   = ["N°", "Nom", "Email", "Téléphone", "Département", "Rôle", "Date", "Entrée", "Sortie", "Durée", "Statut"];
      const colWidths = [5, 22, 28, 14, 18, 12, 12, 10, 10, 10, 12];

      const ws = initSheet("Présences", "BIBLIOTHÈQUE UIYA — PRÉSENCES", period, presences.length, headers, colWidths);

      let totalDurationMs = 0;
      let completedCount  = 0;

      presences.forEach((p, i) => {
        const checkIn  = p.checkIn  ? new Date(p.checkIn)  : null;
        const checkOut = p.checkOut ? new Date(p.checkOut) : null;
        const msec     = checkIn && checkOut ? checkOut - checkIn : null;
        if (msec !== null) { totalDurationMs += msec; completedCount++; }
        const stillIn  = !checkOut;
        const [bg, fg] = stillIn ? [C.returnRow, C.returnText] : [C.white, C.dark];

        addRow(ws, DATA_START + i, [
          i + 1, p.user?.fullName ?? "", p.user?.email ?? "", p.user?.phone ?? "",
          p.user?.department ?? "", roleLabel(p.user?.role),
          fmtDate(checkIn), fmtTime(checkIn),
          checkOut ? fmtTime(checkOut) : "",
          msec !== null ? fmtDuration(msec) : "",
          stillIn ? "En salle" : "Sorti(e)",
        ], bg, fg);
      });

      const avgDuration = completedCount > 0 ? fmtDuration(Math.round(totalDurationMs / completedCount)) : "—";
      addSummary(ws, DATA_START + presences.length, [
        ["Total visites",         presences.length],
        ["Visites complètes",     completedCount],
        ["Encore en salle",       presences.length - completedCount],
        ["Durée moy. de visite",  avgDuration],
      ], headers.length);

      filename = `presences_${dateStr}.xlsx`;

    // ── CATALOGUE ─────────────────────────────────────────────────────
    } else if (type === "books") {
      const books = await Book.find().sort({ category: 1, title: 1 }).lean();

      const headers   = ["N°", "Catégorie", "Titre", "Auteur(s)", "Éditeur", "Année", "ISBN", "Pages", "Exemplaires", "Disponibles", "Statut"];
      const colWidths = [5, 18, 32, 24, 18, 8, 16, 8, 13, 13, 22];

      const ws = initSheet("Catalogue", "BIBLIOTHÈQUE UIYA — CATALOGUE", "Catalogue complet", books.length, headers, colWidths);

      let currentCat = null;
      let rowOffset  = 0;

      books.forEach((b, i) => {
        if (b.category !== currentCat) {
          // Ligne séparateur de catégorie
          const sr = ws.getRow(DATA_START + rowOffset);
          sr.height = 20;
          const catLabel = (b.category ?? "Sans catégorie").toUpperCase();
          sr.getCell(1).value     = `  ${catLabel}`;
          sr.getCell(1).font      = mkFont({ bold: true, color: C.sepText });
          sr.getCell(1).fill      = fl(C.catSep);
          sr.getCell(1).alignment = { vertical: "middle" };
          for (let c = 2; c <= headers.length; c++) {
            sr.getCell(c).fill = fl(C.catSep);
            sr.getCell(c).font = mkFont({ color: C.sepText });
          }
          currentCat = b.category;
          rowOffset++;
        }

        const unavailable = (b.availableCopies ?? 0) === 0;
        const [bg, fg]    = unavailable ? [C.lateRow, C.lateText] : [C.white, C.dark];
        const dispo       = unavailable ? `Épuisé (0/${b.copies})` : `Disponible (${b.availableCopies}/${b.copies})`;

        addRow(ws, DATA_START + rowOffset, [
          i + 1, b.category ?? "", b.title ?? "",
          Array.isArray(b.author) ? b.author.join("; ") : (b.author ?? ""),
          b.publisher ?? "", b.year ?? "", b.isbn ?? "", b.pages ?? "",
          b.copies ?? 0, b.availableCopies ?? 0, dispo,
        ], bg, fg);
        rowOffset++;
      });

      const totalCopies    = books.reduce((s, b) => s + (b.copies ?? 0), 0);
      const totalAvailable = books.reduce((s, b) => s + (b.availableCopies ?? 0), 0);
      const categories     = [...new Set(books.map(b => b.category))].length;
      addSummary(ws, DATA_START + rowOffset, [
        ["Nombre de titres",        books.length],
        ["Nombre de catégories",    categories],
        ["Total exemplaires",       totalCopies],
        ["Exemplaires disponibles", totalAvailable],
        ["Taux de disponibilité",   totalCopies > 0 ? `${Math.round(totalAvailable / totalCopies * 100)} %` : "—"],
      ], headers.length);

      filename = `catalogue_${dateStr}.xlsx`;
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ── Export PDF ────────────────────────────────────────────────────────
export const exportPdf = async (req, res) => {
  try {
    const { type, from, to } = req.query;
    const dateStr = new Date().toISOString().slice(0, 10);

    if (!["loans", "users", "presence", "books"].includes(type)) {
      return res.status(400).json({ message: "Type invalide. Valeurs : loans, users, presence, books" });
    }

    const TYPEINFO = {
      loans:    { label: "EMPRUNTS",      filename: `emprunts_${dateStr}.pdf` },
      users:    { label: "UTILISATEURS",  filename: `utilisateurs_${dateStr}.pdf` },
      presence: { label: "PRÉSENCES",     filename: `presences_${dateStr}.pdf` },
      books:    { label: "CATALOGUE",     filename: `catalogue_${dateStr}.pdf` },
    };

    const { label, filename } = TYPEINFO[type];
    const period = periodLabel(from, to);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
    doc.pipe(res);

    const PW = doc.page.width - 80; // usable width
    const PRIMARY = "#040848";
    const SECONDARY = "#A71E3C";
    const MUTED = "#64748b";

    // ── En-tête ──────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 70).fill(PRIMARY);
    doc.fontSize(18).fillColor("#ffffff").font("Helvetica-Bold")
      .text(`BIBLIOTHÈQUE UIYA — ${label}`, 40, 18);
    doc.fontSize(10).fillColor("rgba(255,255,255,0.6)").font("Helvetica")
      .text(`${period} · Généré le ${fmtDate(new Date())}`, 40, 46);

    doc.y = 90;

    // ── Données ─────────────────────────────────────────────────────
    let rows = [];
    let headers = [];
    let colWidths = [];

    if (type === "loans") {
      const filter = buildDateFilter(from, to, "borrowDate");
      const raw = await Loan.find(filter)
        .populate("user", "fullName department year")
        .populate("book", "title isbn")
        .lean();
      raw.sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));

      headers = ["Lecteur", "Département", "Titre", "ISBN", "Emprunté le", "Statut"];
      colWidths = [140, 100, 180, 90, 80, 80];
      const now = new Date();
      rows = raw.map(l => {
        const due = new Date(l.borrowDate);
        due.setDate(due.getDate() + 14);
        const isLate = l.status === "late" || (l.status === "borrowed" && now > due);
        const statusStr = l.status === "returned" ? "Retourné" : isLate ? "En retard" : "En cours";
        return [
          l.user?.fullName || "—",
          l.user?.department || "—",
          l.book?.title || "—",
          l.book?.isbn || "—",
          fmtDate(l.borrowDate),
          statusStr,
        ];
      });

    } else if (type === "users") {
      const filter = buildDateFilter(from, to, "createdAt");
      const raw = await User.find(filter).select("-password").lean();
      raw.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || "", "fr"));

      headers = ["Nom complet", "Email", "Téléphone", "Département", "Année", "Rôle", "Inscrit le"];
      colWidths = [140, 160, 90, 120, 60, 70, 90];
      rows = raw.map(u => [
        u.fullName || "—", u.email || "—", u.phone || "—",
        u.department || "—", u.year || "—", roleLabel(u.role), fmtDate(u.createdAt),
      ]);

    } else if (type === "presence") {
      const filter = buildDateFilter(from, to, "checkIn");
      const raw = await Presence.find(filter)
        .populate("user", "fullName department role")
        .lean();
      raw.sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));

      headers = ["Nom", "Département", "Rôle", "Date", "Entrée", "Sortie", "Durée"];
      colWidths = [150, 120, 70, 80, 60, 60, 60];
      rows = raw.map(p => {
        const ci = p.checkIn ? new Date(p.checkIn) : null;
        const co = p.checkOut ? new Date(p.checkOut) : null;
        const msec = ci && co ? co - ci : null;
        return [
          p.user?.fullName || "—", p.user?.department || "—", roleLabel(p.user?.role),
          fmtDate(ci), fmtTime(ci), co ? fmtTime(co) : "En salle",
          msec !== null ? fmtDuration(msec) : "—",
        ];
      });

    } else if (type === "books") {
      const raw = await Book.find().sort({ category: 1, title: 1 }).lean();

      headers = ["Titre", "Auteur(s)", "Catégorie", "Éditeur", "Année", "ISBN", "Dispos"];
      colWidths = [180, 120, 100, 100, 50, 90, 60];
      rows = raw.map(b => [
        b.title || "—",
        Array.isArray(b.author) ? b.author.join(", ") : (b.author || "—"),
        b.category || "—",
        b.publisher || "—",
        b.year || "—",
        b.isbn || "—",
        `${b.availableCopies ?? 0}/${b.copies ?? 0}`,
      ]);
    }

    // ── Résumé ───────────────────────────────────────────────────────
    doc.fontSize(11).fillColor(PRIMARY).font("Helvetica-Bold")
      .text(`Total : ${rows.length} enregistrement${rows.length !== 1 ? "s" : ""}`, 40, doc.y);
    doc.moveDown(0.5);

    // ── Table ────────────────────────────────────────────────────────
    const ROW_H = 22;
    const startX = 40;
    let y = doc.y;

    const drawRow = (rowData, isHeader) => {
      // Fond
      if (isHeader) {
        doc.rect(startX, y, PW, ROW_H).fill(PRIMARY);
      } else {
        doc.rect(startX, y, PW, ROW_H).fill(y % (ROW_H * 2) < ROW_H ? "#f8fafc" : "#ffffff");
      }

      // Texte
      let x = startX;
      rowData.forEach((cell, i) => {
        const w = colWidths[i] || 80;
        const text = String(cell ?? "").slice(0, 40);
        doc.fontSize(isHeader ? 8 : 8)
          .fillColor(isHeader ? "#ffffff" : PRIMARY)
          .font(isHeader ? "Helvetica-Bold" : "Helvetica")
          .text(text, x + 4, y + 7, { width: w - 8, lineBreak: false, ellipsis: true });
        x += w;
      });
      y += ROW_H;

      // Nouvelle page si nécessaire
      if (y > doc.page.height - 60) {
        doc.addPage({ margin: 40, size: "A4", layout: "landscape" });
        y = 40;
        drawRow(headers, true);
      }
    };

    drawRow(headers, true);
    rows.forEach(row => drawRow(row, false));

    // ── Pied de page ─────────────────────────────────────────────────
    const totalPages = doc.bufferedPageRange ? doc.bufferedPageRange().count : 1;
    doc.fontSize(8).fillColor(MUTED).font("Helvetica")
      .text(`Bibliothèque UIYA — ${fmtDate(new Date())}`, 40, doc.page.height - 30, { width: PW, align: "center" });

    doc.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.status(500).json({ message: "Erreur serveur" });
  }
};
