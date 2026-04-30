import mongoose from 'mongoose';

const presenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  checkIn: { type: Date, default: Date.now },
  checkOut: { type: Date },
  scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

presenceSchema.index({ user: 1, checkIn: -1 });
presenceSchema.index({ checkIn: -1 });

const Presence = mongoose.model('Presence', presenceSchema);
export default Presence;