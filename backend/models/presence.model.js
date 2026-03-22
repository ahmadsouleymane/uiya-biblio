import mongoose from 'mongoose';

const presenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  checkIn: { type: Date, default: Date.now },
  checkOut: { type: Date }
});

const Presence = mongoose.model('Presence', presenceSchema);
export default Presence;