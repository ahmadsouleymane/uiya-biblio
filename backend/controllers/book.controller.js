import Book from "../models/book.model.js";
import Loan from "../models/loan.model.js";
import AuditLog from "../models/auditLog.model.js";
import { parse } from "csv-parse/sync";

export const generateDescription = async (req, res) => {
  try {
    const { title, author } = req.body;
    if (!title || !author) {
      return res.status(400).json({ message: "Titre et auteur requis" });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return res.status(500).json({ message: "Clé API Groq non configurée" });
    }

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
          {
            role: "user",
            content: `Titre : "${title}"\nAuteur : "${author}"`,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("Groq API error:", err);
      return res.status(502).json({ message: "Erreur de l'API Groq" });
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim();

    if (!description) {
      return res.status(502).json({ message: "Aucune description générée" });
    }

    res.status(200).json({ description });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Erreur lors de la génération" });
  }
};

const ALLOWED_UPDATE_FIELDS = ["isbn", "title", "author", "publisher", "year", "pages", "category", "cover", "copies", "description", "condition", "location", "digitalUrl"];

export const addBook = async (req, res) => {
  try {
    const { isbn, title, author, pages, year, category, cover, copies, publisher, description, condition, location, digitalUrl } = req.body;

    if (!isbn || !title || !author || !pages || !year || !category || !cover || !copies || !publisher) {
      return res.status(400).json({ message: "Veuillez remplir tous les champs obligatoires" });
    }

    const existing = await Book.findOne({ isbn });
    if (existing) return res.status(400).json({ message: "Ce livre existe déjà (ISBN dupliqué)" });

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
      description,
      condition: condition || 'bon',
      location,
      digitalUrl,
      addedBy: req.user._id,
    });

    return res.status(201).json({ message: "Livre ajouté avec succès", book });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Erreur lors de l'ajout du livre" });
  }
};

export const getBooks = async (req, res) => {
  try {
    const { category, search, author, publisher, yearFrom, yearTo, condition, available, location, digitalOnly, sort, sortBy, page, limit } = req.query;
    const filter = {};

    if (category && category !== "tous") filter.category = { $regex: category, $options: "i" };
    if (condition) filter.condition = condition;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (digitalOnly === "true") filter.digitalUrl = { $exists: true, $ne: "" };
    if (publisher) filter.publisher = { $regex: publisher, $options: "i" };
    if (available === "true") filter.availableCopies = { $gt: 0 };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { isbn: { $regex: search, $options: "i" } },
      ];
    } else if (author) {
      filter.author = { $regex: author, $options: "i" };
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
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);
      return res.status(200).json({ books, total, page: pageNum, pages: Math.ceil(total / limitNum) });
    }

    const books = await Book.find(filter).sort(sortOrder);
    res.status(200).json(books);
  } catch (e) {
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
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Livre introuvable" });
    res.status(200).json(book);
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getBookByIsbn = async (req, res) => {
  try {
    const book = await Book.findOne({ isbn: req.params.isbn });
    if (!book) return res.status(404).json({ message: "Livre introuvable" });
    res.status(200).json(book);
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updateBook = async (req, res) => {
  try {
    const update = {};
    ALLOWED_UPDATE_FIELDS.forEach((f) => {
      if (req.body[f] !== undefined) update[f] = req.body[f];
    });
    const book = await Book.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!book) return res.status(404).json({ message: "Livre introuvable" });
    res.status(200).json(book);
  } catch (e) {
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
        const { isbn, title, author, publisher, year, pages, category, cover, copies, description, condition, location, digitalUrl } = row;
        if (!isbn || !title) { errors.push({ isbn, reason: "isbn et title requis" }); continue; }

        const copiesNum = parseInt(copies) || 1;
        const existing = await Book.findOne({ isbn });

        if (existing) {
          await Book.findByIdAndUpdate(existing._id, {
            title, author: author ? author.split(";").map(a => a.trim()) : existing.author,
            publisher, year, pages: parseInt(pages) || existing.pages,
            category, cover, copies: copiesNum, description, condition, location, digitalUrl
          });
          updated++;
        } else {
          await Book.create({
            isbn, title,
            author: author ? author.split(";").map(a => a.trim()) : [],
            publisher: publisher || "", year: year || "", pages: parseInt(pages) || 0,
            category: category || "", cover: cover || "", copies: copiesNum, availableCopies: copiesNum,
            description, condition: condition || "bon", location, digitalUrl,
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
