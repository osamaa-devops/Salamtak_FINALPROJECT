import { FormEvent, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarCheck2, Check, CheckCircle2, Eye, EyeOff, HeartPulse, KeyRound, LoaderCircle, LockKeyhole, Mail, Phone, ShieldCheck, Sparkles, Stethoscope, UserRound, UsersRound, Video } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { api, AuthResult } from "../services/api";
import { toast } from "sonner@2.0.3";
import { PasswordRecovery } from "./PasswordRecovery";

interface Props { onBack: () => void; onLogin: (result: AuthResult) => void; initialRole?: "patient" | "doctor" }

export function AuthPortal({ onBack, onLogin, initialRole = "patient" }: Props) {
  const { language, dir } = useApp();
  const ar = language === "ar";
  const [role, setRole] = useState<"patient" | "doctor">(initialRole);
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [demoPulse, setDemoPulse] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const Back = ar ? ArrowRight : ArrowLeft;
  const Forward = ar ? ArrowLeft : ArrowRight;
  const passwordStrength = passwordValue.length === 0 ? 0 : passwordValue.length < 6 ? 1 : passwordValue.length < 10 ? 2 : /[A-Z]/.test(passwordValue) && /\d/.test(passwordValue) ? 4 : 3;

  const roleContent = role === "patient" ? {
    eyebrow: ar ? "مساحتك الصحية الشخصية" : "Your personal health space",
    title: ar ? "كل خطوة في علاجك، واضحة أمامك." : "Every care step, clear and close.",
    description: ar ? "ادخل لمتابعة مواعيدك وأدويتك وروشتاتك، أو ابدأ استشارة جديدة بدون خطوات معقدة." : "Follow appointments, medication and prescriptions, or start a new consultation without unnecessary steps.",
    features: ar ? ["مواعيدك القادمة في مكان واحد", "تنبيهات الجرعات وخطة العلاج", "استشارات وروشتات محفوظة"] : ["Upcoming appointments in one place", "Dose reminders and care plans", "Saved consultations and prescriptions"],
  } : {
    eyebrow: ar ? "مساحة عمل الطبيب" : "Your doctor workspace",
    title: ar ? "جدولك ومرضاك، بدون تشتيت." : "Your schedule and patients, focused.",
    description: ar ? "راجع مواعيد اليوم، افتح ملفات المرضى، وابدأ الاستشارات واكتب الروشتات من مساحة واحدة." : "Review today’s schedule, open patient records, start consultations and create prescriptions in one workspace.",
    features: ar ? ["جدول يومي واضح وسريع", "ملفات المرضى المرتبطين بك", "استشارات وروشتات موثقة"] : ["A clear daily schedule", "Your linked patient records", "Documented consults and prescriptions"],
  };

  function chooseRole(nextRole: "patient" | "doctor") {
    setRole(nextRole);
    setPasswordValue("");
    setShowPassword(false);
    setRecovering(false);
  }

  function toggleRegister() {
    setRegister(value => !value);
    setPasswordValue("");
    setShowPassword(false);
  }

  function fillDemo() {
    const form = formRef.current;
    if (!form) return;
    const identifier = form.elements.namedItem(role === "doctor" ? "email" : "phone") as HTMLInputElement | null;
    const password = form.elements.namedItem("password") as HTMLInputElement | null;
    if (identifier) identifier.value = role === "doctor" ? "doctor@salamtak.com" : "01234567890";
    if (password) password.value = "Password123!";
    setPasswordValue("Password123!");
    setDemoPulse(true);
    window.setTimeout(() => setDemoPulse(false), 700);
    password?.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") || "");
    if (register && password !== String(data.get("confirmPassword") || "")) {
      toast.error(ar ? "كلمتا المرور غير متطابقتين" : "Passwords do not match"); return;
    }
    setBusy(true);
    try {
      const result = register
        ? await api.register({ role, name: data.get("name"), email: data.get("email") || undefined, phone: data.get("phone") || undefined, password, birthDate: data.get("birthDate") || undefined, specialty: data.get("specialty") || undefined, experience: Number(data.get("experience") || 0), consultationType: "both" })
        : await api.login({ role, email: role === "doctor" ? String(data.get("email") || "") : undefined, phone: role === "patient" ? String(data.get("phone") || "") : undefined, password });
      onLogin(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const duplicate = message.includes("already exists") || message.includes("Duplicate");
      toast.error(duplicate && ar ? "يوجد حساب مسجل بهذه البيانات بالفعل. سجّل الدخول بدلًا من إنشاء حساب جديد." : message || (ar ? "تعذر تسجيل الدخول" : "Unable to sign in"));
    }
    finally { setBusy(false); }
  }

  return (
    <main className="login-v2" dir={dir}>
      <nav className="login-nav">
        <button className="login-logo" onClick={onBack}><span><HeartPulse /></span><div><b>سلامتك</b><small>{ar ? "رعايتك أقرب" : "Care, closer"}</small></div></button>
        <button className="login-back" onClick={onBack}><Back />{ar ? "العودة للرئيسية" : "Back home"}</button>
      </nav>

      <div className="login-layout">
        <section className="login-message" key={role}>
          <span className="eyebrow"><ShieldCheck />{roleContent.eyebrow}</span>
          <h1>{roleContent.title}</h1>
          <p>{roleContent.description}</p>
          <div className="login-benefits">{roleContent.features.map(feature => <span key={feature}><CheckCircle2 />{feature}</span>)}</div>
          <div className={`login-role-preview login-role-preview--${role}`}>
            <div className="role-preview-head"><span>{role === "patient" ? <HeartPulse /> : <Stethoscope />}</span><div><small>{ar ? "بعد تسجيل الدخول" : "After signing in"}</small><b>{role === "patient" ? (ar ? "ملخص رعايتك اليوم" : "Today’s care summary") : (ar ? "ملخص العيادة اليوم" : "Today’s practice summary")}</b></div><i>{ar ? "مباشر" : "Live"}</i></div>
            {role === "patient" ? <div className="role-preview-items"><div><CalendarCheck2 /><p><small>{ar ? "الموعد القادم" : "Next appointment"}</small><b>{ar ? "اليوم · ٤:٣٠ م" : "Today · 4:30 PM"}</b></p></div><div><HeartPulse /><p><small>{ar ? "مؤشر الصحة" : "Health score"}</small><b>92 / 100</b></p></div></div> : <div className="role-preview-items"><div><UsersRound /><p><small>{ar ? "مواعيد اليوم" : "Today’s visits"}</small><b>6</b></p></div><div><Video /><p><small>{ar ? "استشارات مرئية" : "Video consults"}</small><b>3</b></p></div></div>}
          </div>
        </section>

        <section className="login-card-v2">
          {recovering ? <PasswordRecovery role={role} ar={ar} onClose={() => setRecovering(false)} /> : <>
          <div className="login-card-head"><span><Sparkles />{register ? (ar ? "إنشاء حساب سلامتك" : "Create a Salamtak account") : (ar ? "بوابة سلامتك" : "Salamtak access")}</span><h2>{register ? (ar ? "أنشئ حسابك" : "Create your account") : (ar ? "تسجيل الدخول" : "Sign in")}</h2><p>{ar ? "أولًا، اختر كيف تستخدم سلامتك" : "First, choose how you use Salamtak"}</p></div>
          <div className="role-tabs" role="tablist" aria-label={ar ? "نوع الحساب" : "Account type"}>
            <button type="button" role="tab" aria-selected={role === "patient"} className={role === "patient" ? "active" : ""} onClick={() => chooseRole("patient")}><UserRound /><span><b>{ar ? "أنا مريض" : "I’m a patient"}</b><small>{ar ? "مواعيدي وخطتي العلاجية" : "My appointments and care"}</small></span><Check className="role-tab-check" /></button>
            <button type="button" role="tab" aria-selected={role === "doctor"} className={role === "doctor" ? "active" : ""} onClick={() => chooseRole("doctor")}><Stethoscope /><span><b>{ar ? "أنا طبيب" : "I’m a doctor"}</b><small>{ar ? "مرضاي وجدول العيادة" : "My patients and schedule"}</small></span><Check className="role-tab-check" /></button>
          </div>
          <div className="login-form-intro"><span>{role === "patient" ? <UserRound /> : <Stethoscope />}</span><div><b>{role === "patient" ? (ar ? "الدخول كمريض" : "Patient sign in") : (ar ? "الدخول كطبيب" : "Doctor sign in")}</b><small>{role === "patient" ? (ar ? "استخدم رقم الهاتف المسجّل" : "Use your registered phone") : (ar ? "استخدم بريدك المهني" : "Use your professional email")}</small></div></div>
          <form ref={formRef} onSubmit={submit} className={demoPulse ? "login-form-v2 demo-filled" : "login-form-v2"} key={`${role}-${register}`}>
            {register && <label><span>{ar ? "الاسم الكامل" : "Full name"}</span><div><UserRound/><input name="name" required placeholder={ar ? "اكتب اسمك الكامل" : "Enter your full name"}/></div></label>}
            {role === "doctor" && <label><span>{ar ? "البريد الإلكتروني" : "Email address"}</span><div><Mail/><input name="email" type="email" required placeholder="doctor@example.com" dir="ltr"/></div></label>}
            {role === "patient" && <label><span>{ar ? "رقم الهاتف" : "Phone number"}</span><div><Phone/><input name="phone" type="tel" required placeholder="01xxxxxxxxx" dir="ltr"/></div></label>}
            {register && role === "patient" && <label><span>{ar ? "البريد الإلكتروني (اختياري)" : "Email (optional)"}</span><div><Mail/><input name="email" type="email" placeholder="name@example.com" dir="ltr"/></div></label>}
            {register && role === "doctor" && <div className="login-form-grid"><label><span>{ar ? "التخصص" : "Specialty"}</span><input name="specialty" required placeholder={ar ? "مثال: القلب" : "Cardiology"}/></label><label><span>{ar ? "سنوات الخبرة" : "Experience"}</span><input name="experience" type="number" min="0" placeholder="5"/></label></div>}
            {register && role === "patient" && <label><span>{ar ? "تاريخ الميلاد" : "Birth date"}</span><input name="birthDate" type="date"/></label>}
            <label><span>{ar ? "كلمة المرور" : "Password"}</span><div><LockKeyhole/><input name="password" type={showPassword ? "text" : "password"} required minLength={6} placeholder="••••••••" onChange={event => setPasswordValue(event.target.value)}/><button type="button" onClick={() => setShowPassword(v => !v)} aria-label={ar ? "إظهار كلمة المرور" : "Show password"}>{showPassword ? <EyeOff/> : <Eye/>}</button></div></label>
            {register && <div className={`password-strength strength-${passwordStrength}`}><div><i></i><i></i><i></i><i></i></div><span>{passwordStrength < 2 ? (ar ? "استخدم 6 أحرف على الأقل" : "Use at least 6 characters") : passwordStrength < 4 ? (ar ? "قوة كلمة المرور: جيدة" : "Password strength: good") : (ar ? "قوة كلمة المرور: ممتازة" : "Password strength: excellent")}</span></div>}
            {register && <label><span>{ar ? "تأكيد كلمة المرور" : "Confirm password"}</span><div><LockKeyhole/><input name="confirmPassword" type="password" required minLength={6} placeholder="••••••••"/></div></label>}
            {!register && <div className="login-options"><label><input type="checkbox" name="remember" defaultChecked/><span>{ar ? "تذكّرني على هذا الجهاز" : "Remember me"}</span></label><button type="button" onClick={() => setRecovering(true)}>{ar ? "نسيت كلمة المرور؟" : "Forgot password?"}</button></div>}
            <button className="login-submit" disabled={busy}>{busy ? <><LoaderCircle className="login-loader" />{ar ? "نتحقق من بياناتك..." : "Checking your details..."}</> : <>{register ? (ar ? "إنشاء الحساب والمتابعة" : "Create account and continue") : (ar ? "الدخول إلى حسابي" : "Sign in to my account")}<Forward /></>}</button>
          </form>
          <div className="login-divider"><span>{ar ? "أو" : "or"}</span></div>
          <button className="login-switch" onClick={toggleRegister}>{register ? (ar ? "لديك حساب بالفعل؟ سجّل الدخول" : "Already have an account? Sign in") : (ar ? "ليس لديك حساب؟ أنشئ حسابًا جديدًا" : "No account yet? Create one")}</button>
          {!register && <button className={demoPulse ? "demo-hint is-filled" : "demo-hint"} onClick={fillDemo}><span><KeyRound /></span><div><b>{ar ? "جرّب الحساب التجريبي" : "Try the demo account"}</b><small>{ar ? "اضغط لتعبئة البيانات تلقائيًا" : "Click to fill credentials automatically"}</small></div><Forward /></button>}
          <div className="login-security-note"><ShieldCheck /><span>{ar ? "اتصال آمن — لن نطلب بياناتك الطبية في صفحة الدخول" : "Secure connection — we never ask for medical data on sign in"}</span></div>
          </>}
        </section>
      </div>
    </main>
  );
}
