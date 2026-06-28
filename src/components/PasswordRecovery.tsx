import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole, Mail, RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { api } from "../services/api";

interface Props { role: "patient" | "doctor"; ar: boolean; onClose: () => void }

export function PasswordRecovery({ role, ar, onClose }: Props) {
  const [step, setStep] = useState<"email" | "otp" | "password" | "done">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [resetToken, setResetToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const Back = ar ? ArrowRight : ArrowLeft;

  useEffect(() => {
    if (!seconds) return;
    const timer = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  async function sendCode(event?: FormEvent) {
    event?.preventDefault(); setBusy(true);
    try {
      await api.forgotPassword({ role, email });
      setStep("otp"); setSeconds(60); setOtp(Array(6).fill(""));
      toast.success(ar ? "لو البريد مسجل، هيوصلك رمز التحقق خلال لحظات" : "If registered, the code will arrive shortly");
      window.setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (error) { toast.error(error instanceof Error ? error.message : (ar ? "تعذر إرسال الرمز" : "Could not send code")); }
    finally { setBusy(false); }
  }

  function changeOtp(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[index] = digit; setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault(); const code = otp.join("");
    if (code.length !== 6) { toast.error(ar ? "اكتب الرمز المكوّن من 6 أرقام" : "Enter the 6-digit code"); return; }
    setBusy(true);
    try { const result = await api.verifyResetOtp({ role, email, otp: code }); setResetToken(result.resetToken); setStep("password"); }
    catch (error) { toast.error(error instanceof Error ? error.message : (ar ? "الرمز غير صحيح" : "Invalid code")); }
    finally { setBusy(false); }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const password = String(data.get("password") || "");
    if (password !== data.get("confirmPassword")) { toast.error(ar ? "كلمتا المرور غير متطابقتين" : "Passwords do not match"); return; }
    setBusy(true);
    try { await api.resetPassword({ resetToken, password }); setStep("done"); }
    catch (error) { toast.error(error instanceof Error ? error.message : (ar ? "تعذر تغيير كلمة المرور" : "Could not reset password")); }
    finally { setBusy(false); }
  }

  return <div className="recovery-panel">
    {step !== "done" && <button type="button" className="recovery-back" onClick={step === "email" ? onClose : () => setStep(step === "password" ? "otp" : "email")}><Back />{ar ? "رجوع" : "Back"}</button>}
    <div className="recovery-icon">{step === "done" ? <CheckCircle2 /> : step === "email" ? <Mail /> : step === "otp" ? <ShieldCheck /> : <LockKeyhole />}</div>
    <span className="recovery-kicker">{role === "patient" ? (ar ? "حساب المريض" : "Patient account") : (ar ? "حساب الطبيب" : "Doctor account")}</span>
    <h2>{step === "email" ? (ar ? "نسيت كلمة المرور؟" : "Forgot your password?") : step === "otp" ? (ar ? "تحقق من بريدك" : "Check your email") : step === "password" ? (ar ? "كلمة مرور جديدة" : "Create a new password") : (ar ? "تم تغيير كلمة المرور" : "Password updated")}</h2>
    <p>{step === "email" ? (ar ? "اكتب البريد الإلكتروني المسجل بالحساب وسنرسل لك رمزًا من 6 أرقام." : "Enter the registered email and we'll send a 6-digit code.") : step === "otp" ? (ar ? `أرسلنا الرمز إلى ${email}. صالح لمدة 10 دقائق.` : `We sent a code to ${email}. It is valid for 10 minutes.`) : step === "password" ? (ar ? "استخدم 8 أحرف على الأقل واختر كلمة يصعب تخمينها." : "Use at least 8 characters and a hard-to-guess password.") : (ar ? "تقدر دلوقتي تسجل الدخول بكلمة المرور الجديدة." : "You can now sign in with your new password.")}</p>
    {step === "email" && <form className="recovery-form" onSubmit={sendCode}><label>{ar ? "البريد الإلكتروني المسجل" : "Registered email"}<div><Mail /><input type="email" dir="ltr" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" /></div></label><button disabled={busy}>{busy ? <LoaderCircle className="login-loader" /> : <KeyRound />}{ar ? "إرسال رمز التحقق" : "Send verification code"}</button></form>}
    {step === "otp" && <form className="recovery-form" onSubmit={verifyCode}><div className="otp-inputs" dir="ltr">{otp.map((digit, index) => <input key={index} ref={el => { otpRefs.current[index] = el; }} value={digit} inputMode="numeric" maxLength={1} onChange={e => changeOtp(index, e.target.value)} onKeyDown={e => { if (e.key === "Backspace" && !otp[index] && index) otpRefs.current[index - 1]?.focus(); }} onPaste={e => { const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6); if (pasted.length === 6) { e.preventDefault(); setOtp(pasted.split("")); otpRefs.current[5]?.focus(); } }} />)}</div><button disabled={busy}>{busy ? <LoaderCircle className="login-loader" /> : <ShieldCheck />}{ar ? "تأكيد الرمز" : "Verify code"}</button><button type="button" className="resend-code" disabled={seconds > 0 || busy} onClick={() => sendCode()}><RotateCcw />{seconds ? (ar ? `إعادة الإرسال بعد ${seconds}ث` : `Resend in ${seconds}s`) : (ar ? "إرسال رمز جديد" : "Send a new code")}</button></form>}
    {step === "password" && <form className="recovery-form" onSubmit={savePassword}><label>{ar ? "كلمة المرور الجديدة" : "New password"}<div><LockKeyhole /><input name="password" type={showPassword ? "text" : "password"} required minLength={8} /><button type="button" onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label><label>{ar ? "تأكيد كلمة المرور" : "Confirm password"}<div><LockKeyhole /><input name="confirmPassword" type={showPassword ? "text" : "password"} required minLength={8} /></div></label><button disabled={busy}>{busy ? <LoaderCircle className="login-loader" /> : <LockKeyhole />}{ar ? "حفظ كلمة المرور" : "Save password"}</button></form>}
    {step === "done" && <button type="button" className="recovery-done" onClick={onClose}>{ar ? "العودة لتسجيل الدخول" : "Back to sign in"}</button>}
  </div>;
}
