import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'available', 'cancelled', 'expired'],
    default: 'pending'
  },
  notifiedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

reservationSchema.index({ user: 1, status: 1 });
reservationSchema.index({ book: 1, status: 1, createdAt: 1 });
reservationSchema.index({ createdAt: -1 });
reservationSchema.index({ status: 1, createdAt: -1 });

const Reservation = mongoose.model('Reservation', reservationSchema);
export default Reservation;
