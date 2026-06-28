import { Router } from "express";
import rateLimit from "express-rate-limit";
import { forgotPassword, login, me, register, updateForgottenPassword, verifyResetOtp } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, verifyResetOtpSchema } from "../validators/authValidators.js";

export const authRoutes = Router();

authRoutes.post("/register", validate(registerSchema), register);
authRoutes.post("/login", validate(loginSchema), login);

function recoveryLimiter(max, message) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({ success: false, message }),
  });
}

authRoutes.post("/forgot-password", recoveryLimiter(5, "Too many code requests. Please try again in 15 minutes."), validate(forgotPasswordSchema), forgotPassword);
authRoutes.post("/verify-reset-otp", recoveryLimiter(15, "Too many verification attempts. Please request a new code later."), validate(verifyResetOtpSchema), verifyResetOtp);
authRoutes.post("/reset-password", recoveryLimiter(5, "Too many password reset attempts. Please try again later."), validate(resetPasswordSchema), updateForgottenPassword);
authRoutes.get("/me", protect, me);
