import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patientName: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, minlength: 10 },
    verified: { type: Boolean, default: true },
    helpful: { type: Number, default: 0 },
    helpfulUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    category: { type: String, enum: ["doctor", "clinic", "lab", "hospital"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetName: { type: String, required: true, trim: true },
    categories: {
      quality: { type: Number, min: 0, max: 5, default: 0 },
      waiting: { type: Number, min: 0, max: 5, default: 0 },
      staff: { type: Number, min: 0, max: 5, default: 0 },
      cleanliness: { type: Number, min: 0, max: 5, default: 0 },
      value: { type: Number, min: 0, max: 5, default: 0 },
    },
  },
  { timestamps: true },
);

reviewSchema.index({ category: 1, rating: -1 });
reviewSchema.index({ targetName: 1 });

export const Review = mongoose.model("Review", reviewSchema);
