import Category from "../models/category.model.js";
import Book from "../models/book.model.js";

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json(categories);
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Nom requis" });

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ message: "Cette catégorie existe déjà" });

    const category = await Category.create({ name: name.trim() });
    res.status(201).json(category);
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Nom requis" });

    const existing = await Category.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
    if (existing) return res.status(400).json({ message: "Cette catégorie existe déjà" });

    const old = await Category.findById(req.params.id);
    if (!old) return res.status(404).json({ message: "Catégorie introuvable" });

    // Mettre à jour les livres qui utilisent l'ancien nom
    await Book.updateMany({ category: old.name }, { category: name.trim() });

    old.name = name.trim();
    await old.save();

    res.status(200).json(old);
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Catégorie introuvable" });

    const bookCount = await Book.countDocuments({ category: category.name });
    if (bookCount > 0) {
      return res.status(400).json({ message: `Impossible : ${bookCount} livre(s) utilisent cette catégorie` });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Catégorie supprimée" });
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
