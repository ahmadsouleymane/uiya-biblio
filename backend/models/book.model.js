import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  isbn: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: [String],
    required: true
  },
  publisher: {
    type: String,
    required: true
  },
  year: {
    type: String,
    required: true
  },
  pages: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  cover: {
    type: String,
    required: true
  },
  copies: {
    type: Number,
    default: 1,
    min: 0
  },
  availableCopies: {
    type: Number,
    default: 1,
    min: 0
  },
  description: {
    type: String
  },
  condition: {
    type: String,
    enum: ['neuf', 'bon', 'usé', 'endommagé'],
    default: 'bon'
  },
  location: {
    type: String
  },
  pdfFile: {
    type: String
  },
  pdfPublicId: {
    type: String
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

bookSchema.index({ category: 1 });
bookSchema.index({ title: "text", author: "text" });

const Book = mongoose.model('Book', bookSchema);
export default Book;