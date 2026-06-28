import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    role: z.enum(["patient", "doctor"]),
    name: z.string().min(2),
    email: z.string().email().optional(),
    phone: z.string().min(6).optional(),
    password: z.string().min(6),
    birthDate: z.coerce.date().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    specialty: z.string().optional(),
    experience: z.coerce.number().min(0).optional(),
    address: z.string().optional(),
    clinic: z.string().optional(),
    workHours: z.string().optional(),
    fee: z.coerce.number().min(0).optional(),
    consultationType: z.enum(["clinic", "video", "both"]).optional(),
  }).refine((data) => data.email || data.phone, {
    message: "Either email or phone is required",
    path: ["email"],
  }).refine((data) => data.role !== "doctor" || Boolean(data.email && data.specialty), {
    message: "Doctor registration requires email and specialty",
    path: ["specialty"],
  }),
});

export const loginSchema = z.object({
  body: z.object({
    role: z.enum(["patient", "doctor", "admin"]),
    email: z.string().email().optional(),
    phone: z.string().min(6).optional(),
    password: z.string().min(1),
  }).refine((data) => data.email || data.phone, {
    message: "Email or phone is required",
    path: ["email"],
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({ role: z.enum(["patient", "doctor"]), email: z.string().email() }),
});

export const verifyResetOtpSchema = z.object({
  body: z.object({ role: z.enum(["patient", "doctor"]), email: z.string().email(), otp: z.string().regex(/^\d{6}$/) }),
});

export const resetPasswordSchema = z.object({
  body: z.object({ resetToken: z.string().min(32), password: z.string().min(8) }),
});
