import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { DoctorProfile } from "../models/DoctorProfile.js";
import { PatientProfile } from "../models/PatientProfile.js";
import { AppError } from "../utils/AppError.js";
import { signAccessToken } from "./tokenService.js";

function publicUser(user) {
  const object = user.toObject ? user.toObject() : user;
  delete object.passwordHash;
  return object;
}

export async function registerUser(payload) {
  const email = payload.email?.trim().toLowerCase() || undefined;
  const phone = payload.phone?.trim() || undefined;
  const identifiers = [email ? { email } : null, phone ? { phone } : null].filter(Boolean);
  const existing = identifiers.length ? await User.findOne({ $or: identifiers }) : null;
  if (existing) {
    const field = email && existing.email === email ? "email" : "phone";
    throw new AppError(`An account with this ${field} already exists. Please sign in instead.`, 409);
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const user = await User.create({
    name: payload.name.trim(),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    role: payload.role,
    passwordHash,
  });

  try {
    if (payload.role === "doctor") {
      await DoctorProfile.create({
        user: user._id,
        specialty: payload.specialty,
        experience: payload.experience || 0,
        address: payload.address,
        clinic: payload.clinic || payload.address,
        workHours: payload.workHours,
        fee: payload.fee || 0,
        availableSlots: payload.availableSlots || ["09:00", "10:00", "11:00", "14:00", "15:00"],
        consultationType: payload.consultationType || "clinic",
        isAvailableForVideo: payload.consultationType === "video" || payload.consultationType === "both",
      });
    } else {
      await PatientProfile.create({
        user: user._id,
        birthDate: payload.birthDate,
        gender: payload.gender,
        address: payload.address,
        status: "healthy",
      });
    }
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw error;
  }

  return {
    user: publicUser(user),
    token: signAccessToken(user),
  };
}

export async function loginUser(payload) {
  const filter = payload.email ? { email: payload.email.trim().toLowerCase() } : { phone: payload.phone?.trim() };
  const user = await User.findOne(filter).select("+passwordHash");

  if (!user || user.role !== payload.role) {
    throw new AppError("Invalid credentials", 401);
  }

  const isMatch = await bcrypt.compare(payload.password, user.passwordHash);
  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  return {
    user: publicUser(user),
    token: signAccessToken(user),
  };
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId).select("-passwordHash");
  if (!user) throw new AppError("User not found", 404);

  const profile =
    user.role === "doctor"
      ? await DoctorProfile.findOne({ user: user._id })
      : await PatientProfile.findOne({ user: user._id });

  return { user, profile };
}
