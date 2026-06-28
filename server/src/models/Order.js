import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    medication: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    dosage: String,
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: "Pharmacy", required: true },
    items: [orderItemSchema],
    deliveryAddress: { type: String, required: true, trim: true },
    paymentMethod: { type: String, enum: ["card", "cash"], default: "card" },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    total: { type: Number, required: true },
    status: { type: String, enum: ["pending", "confirmed", "delivering", "completed", "cancelled"], default: "confirmed" },
  },
  { timestamps: true },
);

orderSchema.index({ patient: 1, createdAt: -1 });
orderSchema.index({ pharmacy: 1, status: 1 });

export const Order = mongoose.model("Order", orderSchema);
