import mongoose from "mongoose";

const medicalHistorySchema = new mongoose.Schema(
  {
    condition: { type: String, required: true, trim: true },
    diagnosedDate: Date,
    status: { type: String, trim: true },
    medication: { type: String, trim: true },
  },
  { _id: false },
);

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  relation: { type: String, trim: true },
});

const patientProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    birthDate: Date,
    gender: { type: String, enum: ["male", "female", "other"] },
    address: { type: String, trim: true },
    bloodType: { type: String, trim: true },
    height: Number,
    weight: Number,
    emergencyContact: { type: String, trim: true },
    emergencyContactName: { type: String, trim: true },
    emergencyContacts: [emergencyContactSchema],
    condition: { type: String, trim: true },
    status: { type: String, enum: ["healthy", "stable", "monitoring", "critical"], default: "healthy" },
    visits: { type: Number, default: 0 },
    lastVisit: Date,
    nextAppointment: Date,
    medicalHistory: [medicalHistorySchema],
    allergies: [{ type: String, trim: true }],
    healthMetrics: [
      {
        label: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true },
        status: { type: String, trim: true },
        color: { type: String, trim: true },
      },
    ],
  },
  { timestamps: true },
);

patientProfileSchema.index({ status: 1 });
patientProfileSchema.index({ condition: "text" });

export const PatientProfile = mongoose.model("PatientProfile", patientProfileSchema);
