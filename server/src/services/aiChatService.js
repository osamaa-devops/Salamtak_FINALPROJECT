import mongoose from "mongoose";
import { AIConversation, ensureAIConversationIndexes } from "../models/AIConversation.js";
import { DoctorProfile } from "../models/DoctorProfile.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

async function doctorsContext() {
  const doctors = await DoctorProfile.find({}).populate("user", "name").lean();
  return doctors.map((doctor) => ({
    doctor_name: doctor.user?.name,
    specialty: doctor.specialty,
    day: doctor.workHours,
    available_slots: doctor.availableSlots?.length || 0,
    price: doctor.fee ? `${doctor.fee} EGP` : undefined,
    location: doctor.clinic || doctor.address,
    consultation_type: doctor.consultationType,
  })).filter((doctor) => doctor.doctor_name);
}

function conversationFilter(patientId, conversationId) {
  if (!mongoose.isValidObjectId(conversationId)) throw new AppError("Invalid conversation id", 400);
  return { _id: conversationId, patient: patientId };
}

export async function listAIConversations(patientId) {
  await ensureAIConversationIndexes();
  return AIConversation.find({ patient: patientId })
    .select("title updatedAt createdAt messages")
    .sort({ updatedAt: -1 })
    .lean()
    .then((items) => items.map((item) => ({
      _id: item._id,
      title: item.title,
      updatedAt: item.updatedAt,
      preview: item.messages.at(-1)?.content || "",
      messageCount: item.messages.length,
    })));
}

export async function createAIConversation(patientId) {
  await ensureAIConversationIndexes();
  return AIConversation.create({ patient: patientId, messages: [] });
}

export async function getAIHistory(patientId, conversationId) {
  await ensureAIConversationIndexes();
  let conversation;
  if (conversationId) conversation = await AIConversation.findOne(conversationFilter(patientId, conversationId)).lean();
  else conversation = await AIConversation.findOne({ patient: patientId }).sort({ updatedAt: -1 }).lean();
  return { conversationId: conversation?._id || null, messages: conversation?.messages || [] };
}

export async function sendAIMessage(patientId, payload) {
  await ensureAIConversationIndexes();
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  if (!message) throw new AppError("Message is required", 400);
  if (message.length > 600) throw new AppError("Message cannot exceed 600 characters", 400);

  let conversation = payload.conversationId
    ? await AIConversation.findOne(conversationFilter(patientId, payload.conversationId))
    : await AIConversation.create({ patient: patientId, messages: [] });
  if (!conversation) throw new AppError("Conversation not found", 404);
  const isNewChat = !conversation.messages.length;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 75_000);
  let response;
  try {
    response = await fetch(env.aiChatbotUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: String(conversation._id), message, isNewChat, doctorsContext: await doctorsContext(), language: payload.language === "en" ? "en" : "ar" }),
      signal: controller.signal,
    });
  } catch (error) {
    if (isNewChat) await AIConversation.deleteOne({ _id: conversation._id, messages: { $size: 0 } });
    throw new AppError(error.name === "AbortError" ? "Hakim took too long to respond. Please try again." : "Hakim is temporarily unavailable.", 503);
  } finally { clearTimeout(timeout); }

  const text = await response.text();
  let result;
  try { result = JSON.parse(text); } catch { throw new AppError("Hakim returned an invalid response.", 502); }
  if (!response.ok) throw new AppError(result.detail || "Hakim could not answer right now.", 502);

  if (!conversation.messages.length) conversation.title = message.slice(0, 55);
  conversation.messages.push(
    { role: "user", content: message },
    { role: "assistant", content: result.reply, intent: result.intent, suggestions: result.suggestions || [] },
  );
  if (conversation.messages.length > 100) conversation.messages = conversation.messages.slice(-100);
  await conversation.save();
  return { conversationId: conversation._id, reply: result.reply, intent: result.intent, suggestions: result.suggestions || [], matchesCount: result.matches_count || 0, doctorRecommendations: result.doctor_recommendations || [] };
}

export async function clearAIConversation(patientId, conversationId) {
  const filter = conversationId ? conversationFilter(patientId, conversationId) : { patient: patientId };
  const conversations = await AIConversation.find(filter).select("_id").lean();
  await AIConversation.deleteMany(filter);
  await Promise.all(conversations.map(async (conversation) => {
    const url = env.aiChatbotUrl.replace(/\/chat\/?$/, `/sessions/${conversation._id}/close`);
    try { await fetch(url, { method: "POST", signal: AbortSignal.timeout(10_000) }); } catch { /* Local history is already cleared. */ }
  }));
  return { cleared: true };
}
