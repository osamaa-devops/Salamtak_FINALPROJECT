import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export function assertMailConfigured() {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass || !env.smtp.from) {
    throw new AppError("Email service is not configured. Add the SMTP settings to .env.", 503);
  }
}

export async function sendPasswordResetOtp({ to, name, otp }) {
  assertMailConfigured();
  const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });

  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: "رمز استعادة كلمة المرور | سلامتك",
    text: `مرحباً ${name}، رمز استعادة كلمة المرور هو: ${otp}. الرمز صالح لمدة 10 دقائق. لا تشاركه مع أي شخص.`,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#123b35"><h2 style="color:#087f6b">سلامتك</h2><p>مرحباً ${name}،</p><p>استخدم الرمز التالي لاستعادة كلمة المرور:</p><div style="font-size:32px;font-weight:800;letter-spacing:10px;background:#eef9f6;border-radius:14px;padding:18px;text-align:center;color:#087f6b">${otp}</div><p>الرمز صالح لمدة 10 دقائق. لا تشاركه مع أي شخص.</p><small style="color:#6b817d">إذا لم تطلب تغيير كلمة المرور، تجاهل هذه الرسالة.</small></div>`,
  });
}
