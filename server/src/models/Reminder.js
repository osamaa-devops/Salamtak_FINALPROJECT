import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["medication", "appointment", "update", "alert"], required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    time: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

reminderSchema.index({ user: 1, isRead: 1, time: -1 });

export const Reminder = mongoose.model("Reminder", reminderSchema);
