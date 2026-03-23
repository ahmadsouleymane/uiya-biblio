import Loan from "../models/loan.model.js";
import Book from "../models/book.model.js";
import LibrarySettings from "../models/librarySettings.model.js";
import Notification from "../models/notification.model.js";

const FINE_RATE = 500; // FCFA par jour de retard

const markLateLoans = async (loans, loanDays = 14) => {
  const now = new Date();
  const idsToUpdate = [];
  for (const loan of loans) {
    if (loan.status === "borrowed") {
      const due = new Date(loan.borrowDate);
      due.setDate(due.getDate() + loanDays);
      if (now > due) {
        loan.status = "late";
        idsToUpdate.push(loan._id);
      }
    }
  }
  if (idsToUpdate.length > 0) {
    await Loan.updateMany({ _id: { $in: idsToUpdate } }, { status: "late" });
  }
  return loans;
};

const calcFine = (borrowDate, loanDays, now = new Date()) => {
  const due = new Date(borrowDate);
  due.setDate(due.getDate() + loanDays);
  if (now <= due) return null;
  const daysLate = Math.ceil((now - due) / (1000 * 60 * 60 * 24));
  return { daysLate, amount: daysLate * FINE_RATE };
};

export const borrowBook = async (req, res) => {
  try {
    const { userId, bookId } = req.body;
    if (!userId || !bookId) return res.status(400).json({ message: "userId et bookId requis" });

    const settings = await LibrarySettings.getSettings();

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Livre introuvable" });
    if (book.availableCopies <= 0) return res.status(400).json({ message: "Aucun exemplaire disponible" });

    const existingLoan = await Loan.findOne({ user: userId, book: bookId, status: { $in: ["borrowed", "late"] } });
    if (existingLoan) return res.status(400).json({ message: "Ce lecteur a déjà emprunté ce livre" });

    const activeCount = await Loan.countDocuments({ user: userId, status: { $in: ["borrowed", "late"] } });
    if (activeCount >= settings.maxLoansPerUser) {
      return res.status(400).json({ message: `Limite de ${settings.maxLoansPerUser} emprunts simultanés atteinte` });
    }

    book.availableCopies -= 1;
    await book.save();

    const loan = await Loan.create({ user: userId, book: bookId });
    await loan.populate(["user", "book"]);

    res.status(201).json(loan);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const returnBook = async (req, res) => {
  try {
    const settings = await LibrarySettings.getSettings();

    const loan = await Loan.findById(req.params.loanId);
    if (!loan) return res.status(404).json({ message: "Emprunt introuvable" });
    if (loan.status === "returned") return res.status(400).json({ message: "Ce livre a déjà été retourné" });

    const now = new Date();
    const fine = calcFine(loan.borrowDate, settings.loanDurationDays, now);

    if (fine) {
      await Notification.create({
        user: loan.user,
        type: "fine_created",
        message: `Amende de ${fine.amount} FCFA pour retard de ${fine.daysLate} jour(s) — livre rendu.`,
        link: "/profile",
      });
    }

    loan.status = "returned";
    loan.returnDate = now;
    await loan.save();

    await Book.findByIdAndUpdate(loan.book, { $inc: { availableCopies: 1 } });

    await loan.populate(["user", "book"]);
    res.status(200).json({ loan, fine });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const renewLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.loanId);
    if (!loan) return res.status(404).json({ message: "Emprunt introuvable" });
    if (loan.status === "returned") return res.status(400).json({ message: "Ce livre a déjà été retourné" });
    if (loan.status === "late") return res.status(400).json({ message: "Impossible de renouveler un emprunt en retard" });
    if (loan.renewCount >= 2) return res.status(400).json({ message: "Renouvellement maximum atteint (2 fois)" });

    loan.borrowDate = new Date();
    loan.renewCount += 1;
    await loan.save();

    await loan.populate(["user", "book"]);
    res.status(200).json(loan);
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getUserLoans = async (req, res) => {
  try {
    const settings = await LibrarySettings.getSettings();
    let loans = await Loan.find({ user: req.params.userId })
      .populate("book")
      .populate("user", "-password")
      .sort({ borrowDate: -1 });

    loans = await markLateLoans(loans, settings.loanDurationDays);
    res.status(200).json(loans);
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const returnByUserAndIsbn = async (req, res) => {
  try {
    const settings = await LibrarySettings.getSettings();
    const { userId, isbn } = req.body;
    const book = await Book.findOne({ isbn });
    if (!book) return res.status(404).json({ message: "Livre introuvable avec cet ISBN" });

    const loan = await Loan.findOne({ user: userId, book: book._id, status: { $in: ["borrowed", "late"] } });
    if (!loan) return res.status(404).json({ message: "Aucun emprunt actif pour ce lecteur et ce livre" });

    const now = new Date();
    const fine = calcFine(loan.borrowDate, settings.loanDurationDays, now);

    if (fine) {
      await Notification.create({
        user: loan.user,
        type: "fine_created",
        message: `Amende de ${fine.amount} FCFA pour retard de ${fine.daysLate} jour(s) — livre rendu.`,
        link: "/profile",
      });
    }

    loan.status = "returned";
    loan.returnDate = now;
    await loan.save();
    await Book.findByIdAndUpdate(book._id, { $inc: { availableCopies: 1 } });

    await loan.populate(["user", "book"]);
    res.status(200).json({ loan, fine });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getAllLoans = async (req, res) => {
  try {
    const settings = await LibrarySettings.getSettings();
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 0;

    let query = Loan.find()
      .populate("book")
      .populate("user", "-password")
      .sort({ borrowDate: -1 });

    if (page > 0 && limit > 0) {
      query = query.skip((page - 1) * limit).limit(limit);
    }

    let loans = await query;
    loans = await markLateLoans(loans, settings.loanDurationDays);

    if (page > 0 && limit > 0) {
      const total = await Loan.countDocuments();
      return res.status(200).json({ loans, total, page, pages: Math.ceil(total / limit) });
    }

    res.status(200).json(loans);
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getEmployeeDashboardStats = async (req, res) => {
  try {
    const settings = await LibrarySettings.getSettings();
    const now = new Date();

    const dueTodayStart = new Date(now); dueTodayStart.setHours(0, 0, 0, 0);
    const dueTodayEnd = new Date(now); dueTodayEnd.setHours(23, 59, 59, 999);

    const activeLoans = await Loan.find({ status: { $in: ["borrowed", "late"] } })
      .populate("user", "fullName")
      .populate("book", "title");
    await markLateLoans(activeLoans, settings.loanDurationDays);

    const dueToday = activeLoans.filter(l => {
      const due = new Date(l.borrowDate);
      due.setDate(due.getDate() + settings.loanDurationDays);
      return due >= dueTodayStart && due <= dueTodayEnd;
    });

    const overdueLoans = activeLoans.filter(l => l.status === "late");

    res.status(200).json({
      dueToday: dueToday.length,
      dueTodayLoans: dueToday.slice(0, 5),
      overdueCount: overdueLoans.length,
      pendingReservations: 0,
    });
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
