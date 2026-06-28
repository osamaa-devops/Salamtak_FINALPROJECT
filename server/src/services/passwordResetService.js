import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { env } from "../config/env.js";
import { PasswordReset } from "../models/PasswordReset.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { assertMailConfigured, sendPasswordResetOtp } from "./mailService.js";

const OTP_TTL = 10 * 60 * 1000;
const TOKEN_TTL = 10 * 60 * 1000;
const RESEND_WAIT = 60 * 1000;
const MAX_ATTEMPTS = 5;
const genericMessage = "If an account matches this email, a verification code has been sent.";

function digest(value) {
  return crypto.createHmac("sha256", env.jwtSecret).update(value).digest("hex");
}

export async function requestPasswordReset(payload, options = {}) {
  const sendOtp = options.sendOtp || sendPasswordResetOtp;
  if (!options.sendOtp) assertMailConfigured();
  const email = payload.email.trim().toLowerCase();
  const user = await User.findOne({ email, role: payload.role, isActive: true });
  if (!user) return { message: genericMessage };

  const recent = await PasswordReset.findOne({ user: user._id, usedAt: null }).sort({ createdAt: -1 });
  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_WAIT) {
    throw new AppError("Please wait one minute before requesting another code.", 429);
  }

  const otp = String(crypto.randomInt(100000, 1000000));
  await PasswordReset.deleteMany({ user: user._id });
  const reset = await PasswordReset.create({
    user: user._id,
    email,
    role: payload.role,
    otpHash: digest(otp),
    expiresAt: new Date(Date.now() + OTP_TTL),
  });

  try {
    await sendOtp({ to: email, name: user.name, otp });
  } catch (error) {
    await PasswordReset.deleteOne({ _id: reset._id });
    if (error instanceof AppError) throw error;
    throw new AppError("The verification email could not be sent. Please try again later.", 502);
  }
  return { message: genericMessage };
}

export async function verifyPasswordResetOtp(payload) {
  const email = payload.email.trim().toLowerCase();
  const reset = await PasswordReset.findOne({ email, role: payload.role, usedAt: null }).sort({ createdAt: -1 });
  if (!reset || reset.expiresAt <= new Date()) throw new AppError("The verification code is invalid or expired.", 400);
  if (reset.attempts >= MAX_ATTEMPTS) throw new AppError("Too many incorrect attempts. Request a new code.", 429);

  if (reset.otpHash !== digest(payload.otp)) {
    reset.attempts += 1;
    await reset.save();
    throw new AppError("The verification code is incorrect.", 400);
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  reset.verifiedAt = new Date();
  reset.resetTokenHash = digest(resetToken);
  reset.resetTokenExpiresAt = new Date(Date.now() + TOKEN_TTL);
  await reset.save();
  return { resetToken };
}

export async function resetPassword(payload) {
  const reset = await PasswordReset.findOne({
    resetTokenHash: digest(payload.resetToken),
    verifiedAt: { $ne: null },
    usedAt: null,
    resetTokenExpiresAt: { $gt: new Date() },
  });
  if (!reset) throw new AppError("The password reset session is invalid or expired.", 400);

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const updated = await User.updateOne({ _id: reset.user, isActive: true }, { passwordHash });
  if (!updated.modifiedCount) throw new AppError("Account not found.", 404);
  reset.usedAt = new Date();
  reset.otpHash = digest(crypto.randomBytes(32).toString("hex"));
  reset.resetTokenHash = undefined;
  await reset.save();
  return { message: "Password updated successfully." };
}
