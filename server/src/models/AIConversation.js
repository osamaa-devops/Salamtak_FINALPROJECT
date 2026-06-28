import mongoose from "mongoose";

const aiMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  intent: String,
  suggestions: [String],
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const aiConversationSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, trim: true, default: "محادثة جديدة" },
  messages: [aiMessageSchema],
}, { timestamps: true });

aiConversationSchema.index({ patient: 1, updatedAt: -1 });

export const AIConversation = mongoose.model("AIConversation", aiConversationSchema);

let indexesReady = false;
export async function ensureAIConversationIndexes() {
  if (indexesReady) return;
  const indexes = await AIConversation.collection.indexes();
  const legacy = indexes.find((index) => index.name === "patient_1" && index.unique);
  if (legacy) await AIConversation.collection.dropIndex("patient_1");
  await AIConversation.createIndexes();
  indexesReady = true;
}
