import mongoose from "mongoose";

const doctorProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    specialty: { type: String, required: true, trim: true },
    experience: { type: Number, default: 0, min: 0 },
    clinic: { type: String, trim: true },
    address: { type: String, trim: true },
    workHours: { type: String, trim: true },
    fee: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    availableSlots: [{ type: String, trim: true }],
    consultationType: { type: String, enum: ["clinic", "video", "both"], default: "clinic" },
    isAvailableForVideo: { type: Boolean, default: false },
    nextAvailable: String,
  },
  { timestamps: true },
);

doctorProfileSchema.index({ specialty: 1 });
doctorProfileSchema.index({ rating: -1 });

export const DoctorProfile = mongoose.model("DoctorProfile", doctorProfileSchema);
