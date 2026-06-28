import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    inStock: { type: Boolean, default: true },
    prescriptionRequired: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const pharmacySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    deliveryTime: { type: String, trim: true },
    deliveryFee: { type: Number, default: 0, min: 0 },
    minOrder: { type: Number, default: 0, min: 0 },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    medications: [medicationSchema],
  },
  { timestamps: true },
);

pharmacySchema.index({ name: "text", "medications.name": "text" });

export const Pharmacy = mongoose.model("Pharmacy", pharmacySchema);
