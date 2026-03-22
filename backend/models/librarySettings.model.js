import mongoose from 'mongoose';

const librarySettingsSchema = new mongoose.Schema({
  singleton: {
    type: String,
    default: 'settings',
    unique: true
  },
  fineRatePerDay: {
    type: Number,
    default: 50
  },
  maxLoansPerUser: {
    type: Number,
    default: 3
  },
  loanDurationDays: {
    type: Number,
    default: 14
  },
  emailNotifications: {
    type: Boolean,
    default: true
  }
});

// Helper to always get or create the single settings doc
librarySettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ singleton: 'settings' });
  if (!settings) {
    settings = await this.create({ singleton: 'settings' });
  }
  return settings;
};

const LibrarySettings = mongoose.model('LibrarySettings', librarySettingsSchema);
export default LibrarySettings;
