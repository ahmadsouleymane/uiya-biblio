import mongoose from 'mongoose';

const fineSchema = new mongoose.Schema({
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  daysLate: {
    type: Number,
    default: 0
  },
  reason: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  paidAt: {
    type: Date
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

fineSchema.index({ createdAt: -1 });
fineSchema.index({ user: 1, status: 1 });
fineSchema.index({ status: 1, createdAt: -1 });

const Fine = mongoose.model('Fine', fineSchema);
export default Fine;
