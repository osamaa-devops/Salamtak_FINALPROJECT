const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "salamtak-token";
const USER_KEY = "salamtak-user";

export type UserRole = "patient" | "doctor" | "admin";

export interface ApiUser {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface AuthResult {
  user: ApiUser;
  token: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  details?: Array<{ path?: string; message?: string }>;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): ApiUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function updateStoredUser(user: ApiUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function setAuthSession(result: AuthResult) {
  localStorage.setItem(TOKEN_KEY, result.token);
  localStorage.setItem(USER_KEY, JSON.stringify(result.user));
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const text = await response.text();
  let payload: ApiResponse<T> | null = null;
  if (text) {
    try {
      payload = JSON.parse(text) as ApiResponse<T>;
    } catch {
      if (!response.ok) throw new Error(text.trim() || `Request failed with status ${response.status}`);
      throw new Error("The server returned an invalid response.");
    }
  }

  if (!response.ok) {
    const detail = payload?.details?.[0];
    const validationMessage = detail?.message
      ? `${detail.path ? `${detail.path}: ` : ""}${detail.message}`
      : undefined;
    throw new Error(validationMessage || payload?.message || "Network request failed");
  }

  return payload?.data as T;
}

export const api = {
  login(data: { role: UserRole; email?: string; phone?: string; password: string }) {
    return request<AuthResult>("/auth/login", { method: "POST", body: JSON.stringify(data) });
  },
  register(data: Record<string, unknown>) {
    return request<AuthResult>("/auth/register", { method: "POST", body: JSON.stringify(data) });
  },
  forgotPassword(data: { role: "patient" | "doctor"; email: string }) {
    return request<{ message: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify(data) });
  },
  verifyResetOtp(data: { role: "patient" | "doctor"; email: string; otp: string }) {
    return request<{ resetToken: string }>("/auth/verify-reset-otp", { method: "POST", body: JSON.stringify(data) });
  },
  resetPassword(data: { resetToken: string; password: string }) {
    return request<{ message: string }>("/auth/reset-password", { method: "POST", body: JSON.stringify(data) });
  },
  me() {
    return request<{ user: ApiUser; profile: unknown }>("/auth/me");
  },
  aiConversations() {
    return request<any[]>("/ai/conversations");
  },
  createAIConversation() {
    return request<any>("/ai/conversations", { method: "POST" });
  },
  aiHistory(conversationId?: string) {
    return request<{ conversationId: string | null; messages: any[] }>(conversationId ? `/ai/conversations/${conversationId}/messages` : "/ai/history");
  },
  aiChat(data: { message: string; language: "ar" | "en"; conversationId?: string | null }) {
    return request<{ conversationId: string; reply: string; intent: string; suggestions: string[]; matchesCount: number }>("/ai/chat", { method: "POST", body: JSON.stringify(data) });
  },
  clearAIConversation(conversationId?: string) {
    return request<{ cleared: boolean }>(conversationId ? `/ai/conversations/${conversationId}` : "/ai/conversation", { method: "DELETE" });
  },
  doctors(params = "") {
    return request<any[]>(`/doctors${params}`);
  },
  videoDoctors() {
    return request<any[]>("/doctors/video");
  },
  patients(search = "") {
    return request<any[]>(`/patients${search ? `?search=${encodeURIComponent(search)}` : ""}`);
  },
  patientProfile() {
    return request<any>("/profile/patient");
  },
  updatePatientProfile(data: Record<string, unknown>) {
    return request<any>("/profile/patient", { method: "PATCH", body: JSON.stringify(data) });
  },
  async doctorProfile() {
    try {
      return await request<any>("/profile/doctor");
    } catch (error) {
      if (error instanceof Error && error.message.includes("Route not found")) {
        const result = await request<{ user: ApiUser; profile: any }>("/auth/me");
        return { ...(result.profile || {}), user: result.user };
      }
      throw error;
    }
  },
  updateDoctorProfile(data: Record<string, unknown>) {
    return request<any>("/profile/doctor", { method: "PATCH", body: JSON.stringify(data) });
  },
  appointments() {
    return request<any[]>("/appointments");
  },
  createAppointment(data: Record<string, unknown>) {
    return request<any>("/appointments", { method: "POST", body: JSON.stringify(data) });
  },
  updateAppointment(id: string, data: Record<string, unknown>) {
    return request<any>(`/appointments/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  createPrescription(data: Record<string, unknown>) {
    return request<any>("/prescriptions", { method: "POST", body: JSON.stringify(data) });
  },
  prescriptions() {
    return request<any[]>("/prescriptions");
  },
  medicationSchedules() {
    return request<any[]>("/medication-schedules");
  },
  createMedicationSchedule(data: Record<string, unknown>) {
    return request<any>("/medication-schedules", { method: "POST", body: JSON.stringify(data) });
  },
  updateMedicationSchedule(id: string, data: Record<string, unknown>) {
    return request<any>(`/medication-schedules/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteMedicationSchedule(id: string) {
    return request<void>(`/medication-schedules/${id}`, { method: "DELETE" });
  },
  reminders() {
    return request<any[]>("/reminders");
  },
  markReminderRead(id: string) {
    return request<any>(`/reminders/${id}/read`, { method: "PATCH" });
  },
  pharmacies(search = "") {
    return request<any[]>(`/pharmacies${search ? `?search=${encodeURIComponent(search)}` : ""}`);
  },
  createOrder(data: Record<string, unknown>) {
    return request<any>("/orders", { method: "POST", body: JSON.stringify(data) });
  },
  orders() {
    return request<any[]>("/orders");
  },
  cancelOrder(id: string) {
    return request<any>(`/orders/${id}/cancel`, { method: "PATCH" });
  },
  reviews(category = "doctor", rating?: number, targetId?: string) {
    const params = new URLSearchParams({ category });
    if (rating) params.set("rating", String(rating));
    if (targetId) params.set("targetId", targetId);
    return request<{ items: any[]; stats: any }>(`/reviews?${params.toString()}`);
  },
  createReview(data: Record<string, unknown>) {
    return request<any>("/reviews", { method: "POST", body: JSON.stringify(data) });
  },
  markReviewHelpful(id: string) {
    return request<any>(`/reviews/${id}/helpful`, { method: "PATCH" });
  },
  startConsultation(data: Record<string, unknown>) {
    return request<any>("/consultations", { method: "POST", body: JSON.stringify(data) });
  },
  consultations() {
    return request<any[]>("/consultations");
  },
  addConsultationMessage(id: string, message: string) {
    return request<any>(`/consultations/${id}/messages`, { method: "POST", body: JSON.stringify({ message }) });
  },
  endConsultation(id: string) {
    return request<any>(`/consultations/${id}/end`, { method: "PATCH" });
  },
};
