import Book from "../models/book.model.js";
import Loan from "../models/loan.model.js";
import AuditLog from "../models/auditLog.model.js";
import { parse } from "csv-parse/sync";
import { uploadPdfBuffer, destroyPdf, isCloudinaryConfigured } from "../config/cloudinary.js";

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Clé de normalisation pour détecter les doublons titre+auteur indépendamment
// de la casse, des accents, de la ponctuation et des espaces multiples.
const normalizeKey = (s) => String(s || "")
  .normalize("NFD").replace(/[̀-ͯ]/g, "") // retire les accents
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const firstAuthor = (a) => Array.isArray(a) ? a[0] : a;

// Cherche un livre existant par ISBN (si fourni et "vrai" ISBN) puis par
// combinaison titre+auteur normalisée. Renvoie le doc trouvé ou null.
const findDuplicate = async ({ isbn, title, author }) => {
  if (isbn && !/^UIYA-/i.test(isbn)) {
    const byIsbn = await Book.findOne({ isbn }).lean();
    if (byIsbn) return { book: byIsbn, reason: "isbn" };
  }
  const titleKey = normalizeKey(title);
  const authorKey = normalizeKey(firstAuthor(author));
  if (!titleKey || !authorKey) return null;
  const candidates = await Book.find({ title: { $regex: escapeRegex(titleKey.slice(0, 30)), $options: "i" } }).lean();
  for (const b of candidates) {
    if (normalizeKey(b.title) === titleKey && normalizeKey(firstAuthor(b.author)) === authorKey) {
      return { book: b, reason: "title_author" };
    }
  }
  return null;
};

export const generateDescription = async (req, res) => {
  try {
    const { title, author } = req.body;
    if (!title || !author) {
      return res.status(400).json({ message: "Titre et auteur requis" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ message: "Clé API Groq non configurée" });
    }

    const description = await fetchAiDescription(title, author);
    if (!description) {
      return res.status(502).json({ message: "Aucune description générée" });
    }

    res.status(200).json({ description });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Erreur lors de la génération" });
  }
};

const ALLOWED_UPDATE_FIELDS = ["isbn", "title", "author", "publisher", "year", "pages", "category", "cover", "copies", "description", "condition", "location", "pdfFile"];

// Helper pour générer une description via Groq
async function fetchAiDescription(title, author) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;

  try {
    const authorStr = Array.isArray(author) ? author.join(", ") : author;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Tu es un bibliothécaire expert. Génère une description courte et pertinente (2-3 phrases max, environ 50 mots) pour un livre de bibliothèque. La description doit donner envie de lire le livre. Réponds uniquement avec la description, sans guillemets ni préambule.",
          },
          { role: "user", content: `Titre : "${title}"\nAuteur : "${authorStr}"` },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

export const addBook = async (req, res) => {
  try {
    const { isbn, title, author, pages, year, category, cover, copies, publisher, description, condition, location, skipDescription } = req.body;

    if (!isbn || !title || !author || !pages || !year || !category || !cover || !copies || !publisher) {
      return res.status(400).json({ message: "Veuillez remplir tous les champs obligatoires" });
    }

    const dup = await findDuplicate({ isbn, title, author });
    if (dup) {
      const reason = dup.reason === "isbn"
        ? "Ce livre existe déjà (même ISBN)"
        : "Ce livre existe déjà (même titre et auteur)";
      return res.status(409).json({ message: reason, existingId: dup.book._id, existingTitle: dup.book.title });
    }

    // Si pas de description fournie, générer automatiquement via IA — sauf en
    // import de masse (skipDescription) où l'admin lancera la génération groupée après.
    let finalDescription = description;
    if (!skipDescription && (!finalDescription || !finalDescription.trim())) {
      finalDescription = await fetchAiDescription(title, author);
    }

    const copiesNum = Number(copies);
    const book = await Book.create({
      isbn,
      title,
      author: Array.isArray(author) ? author : [author],
      publisher,
      year,
      pages: Number(pages),
      category,
      cover,
      copies: copiesNum,
      availableCopies: copiesNum,
      description: finalDescription || "",
      condition: condition || 'bon',
      location,
      addedBy: req.user._id,
    });

    return res.status(201).json({ message: "Livre ajouté avec succès", book });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Erreur lors de l'ajout du livre" });
  }
};

// Vérifie en masse si une liste de livres candidats existe déjà.
// Body: { items: [{ isbn, title, author }, ...] }
// Réponse: { results: [{ duplicate: bool, reason?, existingId?, existingTitle? }] }
//
// Pour rester rapide même sur des milliers d'items, on charge tous les livres
// une seule fois en mémoire et on construit deux index :
//   - isbnIndex   : ISBN exact → livre
//   - titleAuthorIndex : titre+auteur normalisés → livre
// Puis on parcourt les items en O(1) chacun.
export const checkDuplicates = async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (items.length === 0) return res.status(200).json({ results: [] });

    const all = await Book.find({}, { _id: 1, isbn: 1, title: 1, author: 1 }).lean();
    const isbnIndex = new Map();
    const taIndex = new Map();
    for (const b of all) {
      if (b.isbn) isbnIndex.set(b.isbn, b);
      const tk = normalizeKey(b.title);
      const ak = normalizeKey(firstAuthor(b.author));
      if (tk && ak) taIndex.set(tk + "||" + ak, b);
    }

    const results = items.map((it) => {
      const isbn = it?.isbn;
      if (isbn && !/^UIYA-/i.test(isbn)) {
        const hit = isbnIndex.get(isbn);
        if (hit) return { duplicate: true, reason: "isbn", existingId: hit._id, existingTitle: hit.title };
      }
      const tk = normalizeKey(it?.title);
      const ak = normalizeKey(firstAuthor(it?.author));
      if (tk && ak) {
        const hit = taIndex.get(tk + "||" + ak);
        if (hit) return { duplicate: true, reason: "title_author", existingId: hit._id, existingTitle: hit.title };
      }
      return { duplicate: false };
    });

    res.status(200).json({ results });
  } catch (e) {
    console.error("checkDuplicates error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getBooks = async (req, res) => {
  try {
    const { category, search, author, publisher, yearFrom, yearTo, condition, available, location, pdfOnly, sort, sortBy, page, limit } = req.query;
    const filter = {};

    if (category && category !== "tous") filter.category = { $regex: escapeRegex(category), $options: "i" };
    if (condition) filter.condition = condition;
    if (location) filter.location = { $regex: escapeRegex(location), $options: "i" };
    if (pdfOnly === "true") filter.pdfFile = { $exists: true, $ne: "" };
    if (publisher) filter.publisher = { $regex: escapeRegex(publisher), $options: "i" };
    if (available === "true") filter.availableCopies = { $gt: 0 };

    if (search) {
      const esc = escapeRegex(search);
      filter.$or = [
        { title: { $regex: esc, $options: "i" } },
        { author: { $regex: esc, $options: "i" } },
        { isbn: { $regex: esc, $options: "i" } },
      ];
    } else if (author) {
      filter.author = { $regex: escapeRegex(author), $options: "i" };
    }

    if (yearFrom || yearTo) {
      filter.year = {};
      if (yearFrom) filter.year.$gte = yearFrom;
      if (yearTo) filter.year.$lte = yearTo;
    }

    const sortKey = sort || sortBy;
    const sortMap = {
      title:      { title: 1 },
      "-title":   { title: -1 },
      year:       { year: -1 },
      "-year":    { year: 1 },
      createdAt:  { createdAt: -1 },
      available:  { availableCopies: -1 },
    };
    const sortOrder = sortMap[sortKey] || { createdAt: -1 };

    const pageNum = parseInt(page) || 0;
    const limitNum = parseInt(limit) || 0;

    if (pageNum > 0 && limitNum > 0) {
      const total = await Book.countDocuments(filter);
      const books = await Book.find(filter)
        .sort(sortOrder)
        .allowDiskUse(true)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);
      return res.status(200).json({ books, total, page: pageNum, pages: Math.ceil(total / limitNum) });
    }

    const books = await Book.find(filter).sort(sortOrder).allowDiskUse(true);
    res.status(200).json(books);
  } catch (e) {
    console.error("getBooks error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getStats = async (req, res) => {
  try {
    const [totalBooks, categories, available] = await Promise.all([
      Book.countDocuments(),
      Book.distinct("category"),
      Book.aggregate([{ $group: { _id: null, total: { $sum: "$availableCopies" } } }]),
    ]);
    res.status(200).json({
      totalBooks,
      categories: categories.length,
      availableBooks: available[0]?.total || 0,
    });
  } catch (e) {
    console.error("[book] error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Livre introuvable" });
    res.status(200).json(book);
  } catch (e) {
    console.error("[book] error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getBookByIsbn = async (req, res) => {
  try {
    const book = await Book.findOne({ isbn: req.params.isbn });
    if (!book) return res.status(404).json({ message: "Livre introuvable" });
    res.status(200).json(book);
  } catch (e) {
    console.error("[book] error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updateBook = async (req, res) => {
  try {
    const update = {};
    ALLOWED_UPDATE_FIELDS.forEach((f) => {
      if (req.body[f] !== undefined) update[f] = req.body[f];
    });

    const current = await Book.findById(req.params.id);
    if (!current) return res.status(404).json({ message: "Livre introuvable" });

    if (update.copies !== undefined) {
      const newCopies = Number(update.copies);
      if (Number.isNaN(newCopies) || newCopies < 0) {
        return res.status(400).json({ message: "Nombre d'exemplaires invalide" });
      }
      const diff = newCopies - (current.copies || 0);
      const newAvailable = Math.max(0, Math.min(newCopies, (current.availableCopies || 0) + diff));
      update.copies = newCopies;
      update.availableCopies = newAvailable;
    }

    const book = await Book.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!book) return res.status(404).json({ message: "Livre introuvable" });
    res.status(200).json(book);
  } catch (e) {
    console.error("[book] error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: "Livre introuvable" });

    await AuditLog.create({
      user: req.user._id,
      action: "DELETE_BOOK",
      entity: "Book",
      entityId: req.params.id,
      details: { title: book.title, isbn: book.isbn }
    });

    res.status(200).json({ message: "Livre supprimé" });
  } catch (e) {
    console.error("[book] error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : req.cookies?.token;
    if (!token) return res.status(200).json([]);

    let userId;
    try {
      const jwt = await import("jsonwebtoken");
      const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch {
      return res.status(200).json([]);
    }

    // Trouver les catégories préférées de l'utilisateur
    const loans = await Loan.find({ user: userId }).populate("book", "category");
    const categoryCounts = {};
    for (const loan of loans) {
      if (loan.book?.category) {
        categoryCounts[loan.book.category] = (categoryCounts[loan.book.category] || 0) + 1;
      }
    }

    if (Object.keys(categoryCounts).length === 0) {
      // Pas d'historique: retourner les livres récents
      const books = await Book.find({ availableCopies: { $gt: 0 } }).sort({ createdAt: -1 }).limit(6);
      return res.status(200).json(books);
    }

    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    // Livres déjà empruntés
    const borrowedBookIds = loans.map(l => l.book?._id).filter(Boolean);

    const books = await Book.find({
      category: { $in: topCategories },
      _id: { $nin: borrowedBookIds },
    }).limit(6);

    res.status(200).json(books);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const generateAllDescriptions = async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ message: "Clé API Groq non configurée" });
    }

    const books = await Book.find({
      $or: [{ description: { $exists: false } }, { description: "" }, { description: null }],
    }).select("_id title author");

    if (books.length === 0) {
      return res.status(200).json({ message: "Tous les livres ont déjà une description", updated: 0, total: 0 });
    }

    let updated = 0;
    const errors = [];

    for (const book of books) {
      try {
        const description = await fetchAiDescription(book.title, book.author);

        if (description) {
          await Book.findByIdAndUpdate(book._id, { description });
          updated++;
        } else {
          errors.push({ title: book.title, reason: "Aucune description générée" });
        }

        // Pause pour respecter le rate limit Groq
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        errors.push({ title: book.title, reason: err.message });
      }
    }

    res.status(200).json({ updated, total: books.length, errors });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const uploadBookPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Fichier PDF requis" });
    if (!isCloudinaryConfigured()) {
      return res.status(500).json({ message: "Stockage PDF non configuré (Cloudinary)" });
    }
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Livre introuvable" });

    // Supprimer l'ancien PDF sur Cloudinary s'il existe
    if (book.pdfPublicId) {
      try { await destroyPdf(book.pdfPublicId); }
      catch (e) { console.error("Erreur suppression ancien PDF Cloudinary:", e.message); }
    }

    const result = await uploadPdfBuffer(req.file.buffer);
    book.pdfFile = result.secure_url;
    book.pdfPublicId = result.public_id;
    await book.save();
    res.status(200).json({ message: "PDF ajouté", pdfFile: book.pdfFile });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Erreur lors de l'upload du PDF" });
  }
};

export const deleteBookPdf = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Livre introuvable" });
    if (!book.pdfFile) return res.status(400).json({ message: "Aucun PDF associé" });

    if (book.pdfPublicId) {
      try { await destroyPdf(book.pdfPublicId); }
      catch (e) { console.error("Erreur suppression PDF Cloudinary:", e.message); }
    }

    book.pdfFile = undefined;
    book.pdfPublicId = undefined;
    await book.save();
    res.status(200).json({ message: "PDF supprimé" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Erreur lors de la suppression du PDF" });
  }
};

export const importBooksFromCsv = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Fichier CSV requis" });

    const records = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    let inserted = 0, updated = 0, errors = [];

    for (const row of records) {
      try {
        const { isbn, title, author, publisher, year, pages, category, cover, copies, description, condition, location } = row;
        if (!isbn || !title) { errors.push({ isbn, reason: "isbn et title requis" }); continue; }

        const copiesNum = parseInt(copies) || 1;
        const existing = await Book.findOne({ isbn });
        const parseAuthor = (a) => Array.isArray(a) ? a : (a ? String(a).split(";").map(s => s.trim()).filter(Boolean) : []);

        if (existing) {
          await Book.findByIdAndUpdate(existing._id, {
            title, author: author ? parseAuthor(author) : existing.author,
            publisher, year, pages: parseInt(pages) || existing.pages,
            category, cover, copies: copiesNum, description, condition, location
          });
          updated++;
        } else {
          await Book.create({
            isbn, title,
            author: parseAuthor(author),
            publisher: publisher || "", year: year || "", pages: parseInt(pages) || 0,
            category: category || "", cover: cover || "", copies: copiesNum, availableCopies: copiesNum,
            description, condition: condition || "bon", location,
          });
          inserted++;
        }
      } catch (err) {
        errors.push({ isbn: row.isbn, reason: err.message });
      }
    }

    await AuditLog.create({
      user: req.user._id,
      action: "IMPORT_BOOKS_CSV",
      entity: "Book",
      details: { inserted, updated, errors: errors.length }
    });

    res.status(200).json({ inserted, updated, errors });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Erreur lors de l'import CSV" });
  }
};
