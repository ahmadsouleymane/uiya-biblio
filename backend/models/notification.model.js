import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type:    { type: String, enum: ["loan_due", "loan_late", "reservation_available", "fine_created"], required: true },
  message: { type: String, required: true },
  link:    { type: String, default: "" },
  read:    { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
