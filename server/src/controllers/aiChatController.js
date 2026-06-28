import { asyncHandler } from "../utils/asyncHandler.js";
import { clearAIConversation, createAIConversation, getAIHistory, listAIConversations, sendAIMessage } from "../services/aiChatService.js";

export const conversations = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listAIConversations(req.user._id) });
});

export const createConversation = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await createAIConversation(req.user._id) });
});

export const history = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getAIHistory(req.user._id, req.params.conversationId) });
});

export const chat = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await sendAIMessage(req.user._id, req.body) });
});

export const clear = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await clearAIConversation(req.user._id, req.params.conversationId) });
});
