import mongoose from "mongoose";

const medicationScheduleSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    medicationName: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    times: [{ type: String, required: true, trim: true }],
    isActive: { type: Boolean, default: true },
    nextDose: Date,
    takenToday: [{ type: String, trim: true }],
  },
  { timestamps: true },
);

medicationScheduleSchema.index({ patient: 1, isActive: 1 });
medicationScheduleSchema.index({ nextDose: 1 });

export const MedicationSchedule = mongoose.model("MedicationSchedule", medicationScheduleSchema);
