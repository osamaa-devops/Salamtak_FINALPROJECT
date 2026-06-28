import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ["patient", "doctor"], required: true },
    message: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true },
);

const consultationSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    symptoms: { type: String, required: true, trim: true },
    status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
    price: { type: Number, default: 0 },
    messages: [chatMessageSchema],
    endedAt: Date,
  },
  { timestamps: true },
);

consultationSchema.index({ patient: 1, createdAt: -1 });
consultationSchema.index({ doctor: 1, status: 1 });

export const Consultation = mongoose.model("Consultation", consultationSchema);
