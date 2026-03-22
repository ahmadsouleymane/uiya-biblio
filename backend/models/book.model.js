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
    default: 1
  },
  availableCopies: {
    type: Number,
    default: 1
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
  digitalUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Book = mongoose.model('Book', bookSchema);
export default Book;