import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true, trim: true },
    type: { type: String, enum: ["consultation", "followup", "emergency", "video", "checkup"], default: "consultation" },
    symptoms: { type: String, trim: true },
    status: { type: String, enum: ["pending", "waiting", "confirmed", "completed", "cancelled"], default: "pending" },
    clinic: { type: String, trim: true },
    fee: { type: Number, default: 0 },
  },
  { timestamps: true },
);

appointmentSchema.index({ patient: 1, date: 1 });
appointmentSchema.index({ doctor: 1, date: 1 });
appointmentSchema.index({ status: 1 });

export const Appointment = mongoose.model("Appointment", appointmentSchema);
