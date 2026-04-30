import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  borrowDate: { type: Date, default: Date.now },
  returnDate: { type: Date },
  status: { type: String, enum: ['borrowed', 'returned', 'late'], default: 'borrowed' },
  renewCount: { type: Number, default: 0, min: 0 },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  returnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

loanSchema.index({ user: 1, status: 1 });
loanSchema.index({ book: 1, status: 1 });
loanSchema.index({ borrowDate: -1 });

const Loan = mongoose.model('Loan', loanSchema);
export default Loan;