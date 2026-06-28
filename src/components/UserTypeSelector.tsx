import { useState } from "react";
import { ArrowLeft, ArrowRight, CalendarCheck2, Check, Clock3, HeartPulse, Pill, ShieldCheck, ShoppingBag, Stethoscope, UserRound, UsersRound, Video } from "lucide-react";
import { useApp } from "../contexts/AppContext";

type ServiceKey = "appointments" | "video" | "medication" | "pharmacy";

export function UserTypeSelector({ onLogin }: { onLogin: () => void }) {
  const { language, dir } = useApp();
  const ar = language === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const [persona, setPersona] = useState<"patient" | "doctor">("patient");
  const [service, setService] = useState<ServiceKey>("appointments");

  const services = {
    appointments: { icon: CalendarCheck2, label: ar ? "احجز موعد" : "Book a visit", title: ar ? "موعدك في أقل من دقيقتين" : "Book in under two minutes", text: ar ? "اختر الطبيب والوقت، وتابع التأكيد من حسابك." : "Choose a doctor and time, then follow confirmation." },
    video: { icon: Video, label: ar ? "استشر طبيب" : "Video consult", title: ar ? "طبيبك أقرب إليك" : "Your doctor, closer", text: ar ? "استشارة وتشخيص وروشتة محفوظة في ملفك." : "Consult, diagnose and save your prescription." },
    medication: { icon: Pill, label: ar ? "تابع دواءك" : "Medication", title: ar ? "جرعاتك في وقتها" : "Every dose on time", text: ar ? "تذكيرات واضحة ومتابعة للالتزام اليومي." : "Clear reminders and daily adherence tracking." },
    pharmacy: { icon: ShoppingBag, label: ar ? "اطلب دواء" : "Pharmacy", title: ar ? "الدواء حتى باب البيت" : "Delivered to your door", text: ar ? "اختر الصيدلية وأرسل طلبك بسهولة." : "Choose a pharmacy and place your order." },
  };
  const active = services[service];

  return <main className="landing-v4" dir={dir} id="top">
    <section className="hero-v4">
      <div className="hero-v4-copy">
        <span className="hero-v4-tag"><i></i>{ar ? "رعاية طبية متصلة" : "Connected healthcare"}</span>
        <h1>{ar ? <>صحتك كلها.<br/><em>في مكان واحد.</em></> : <>All your health.<br/><em>One simple place.</em></>}</h1>
        <p>{ar ? "احجز طبيبك، تابع علاجك، واطلب دواءك بسهولة." : "Book care, follow treatment and order medication with ease."}</p>
        <div className="hero-v4-actions"><button onClick={onLogin}>{ar ? "ابدأ الآن" : "Get started"}<Arrow /></button><a href="#services">{ar ? "شاهد الخدمات" : "View services"}</a></div>
        <div className="hero-v4-points"><span><Check />{ar ? "سريع" : "Fast"}</span><span><ShieldCheck />{ar ? "آمن" : "Secure"}</span><span><HeartPulse />{ar ? "متصل بطبيبك" : "Connected"}</span></div>
      </div>

      <div className="product-v4">
        <div className="product-v4-tabs"><button className={persona === "patient" ? "active" : ""} onClick={() => setPersona("patient")}><UserRound />{ar ? "مريض" : "Patient"}</button><button className={persona === "doctor" ? "active" : ""} onClick={() => setPersona("doctor")}><Stethoscope />{ar ? "طبيب" : "Doctor"}</button></div>
        <div className="product-v4-screen" key={persona}>
          <div className="product-v4-head"><div><small>{persona === "patient" ? (ar ? "صباح الخير، أسامة" : "Good morning, Osama") : (ar ? "صباح الخير، دكتور" : "Good morning, Doctor")}</small><h2>{persona === "patient" ? (ar ? "رعايتك اليوم" : "Your care today") : (ar ? "جدول العيادة" : "Clinic schedule")}</h2></div><span>{persona === "patient" ? "أ" : "م"}</span></div>
          {persona === "patient" ? <><div className="patient-quick-v4"><button><CalendarCheck2 /><span>{ar ? "حجز" : "Book"}</span></button><button><Video /><span>{ar ? "استشارة" : "Consult"}</span></button><button><ShoppingBag /><span>{ar ? "صيدلية" : "Pharmacy"}</span></button></div><div className="appointment-v4"><div><small>{ar ? "موعدك القادم" : "Next appointment"}</small><b>{ar ? "اليوم · ٤:٣٠ م" : "Today · 4:30 PM"}</b></div><span>م</span><p><b>{ar ? "د. مختار نبيل" : "Dr. Mokhtar Nabil"}</b><small>{ar ? "أمراض القلب" : "Cardiology"}</small></p><button><Video /></button></div><div className="dose-v4"><Pill /><p><small>{ar ? "الجرعة التالية" : "Next dose"}</small><b>{ar ? "ليزينوبريل · ٨:٠٠ م" : "Lisinopril · 8:00 PM"}</b></p><button><Check />{ar ? "تم" : "Taken"}</button></div></> : <><div className="doctor-numbers-v4"><div><UsersRound /><p><small>{ar ? "المرضى" : "Patients"}</small><b>24</b></p></div><div><Video /><p><small>{ar ? "استشارات" : "Consults"}</small><b>06</b></p></div><div><Clock3 /><p><small>{ar ? "انتظار" : "Waiting"}</small><b>03</b></p></div></div><div className="schedule-v4"><div><time>10:30</time><span>س</span><p><b>{ar ? "سارة محمود" : "Sara Mahmoud"}</b><small>{ar ? "متابعة" : "Follow-up"}</small></p><button>{ar ? "فتح" : "Open"}</button></div><div><time>11:15</time><span>م</span><p><b>{ar ? "محمد حسن" : "Mohamed Hassan"}</b><small>{ar ? "استشارة مرئية" : "Video consult"}</small></p><button><Video /></button></div><div><time>12:00</time><span>ف</span><p><b>{ar ? "فاطمة أحمد" : "Fatma Ahmed"}</b><small>{ar ? "كشف جديد" : "New visit"}</small></p><button>{ar ? "تأكيد" : "Confirm"}</button></div></div></>}
        </div>
        <div className="product-v4-safe"><ShieldCheck /><span>{ar ? "بياناتك محمية" : "Your data is protected"}</span></div>
      </div>
    </section>

    <section className="trust-v4"><b>{ar ? "رحلة علاج واحدة" : "One care journey"}</b><span>{ar ? "حجز" : "Booking"}</span><i></i><span>{ar ? "استشارة" : "Consultation"}</span><i></i><span>{ar ? "روشتة" : "Prescription"}</span><i></i><span>{ar ? "دواء" : "Medication"}</span></section>

    <section className="services-v4" id="services">
      <div className="heading-v4"><span>{ar ? "خدمات سلامتك" : "Services"}</span><h2>{ar ? "كل اللي تحتاجه. ببساطة." : "Everything you need. Simply."}</h2></div>
      <div className="services-v4-layout"><div className="services-v4-tabs">{(Object.keys(services) as ServiceKey[]).map(key => { const item = services[key]; return <button key={key} className={service === key ? "active" : ""} onClick={() => setService(key)}><item.icon /><span>{item.label}</span><Arrow /></button>})}</div><div className="service-v4-detail" key={service}><span><active.icon /></span><small>{active.label}</small><h3>{active.title}</h3><p>{active.text}</p><button onClick={onLogin}>{ar ? "استخدم الخدمة" : "Use service"}<Arrow /></button></div></div>
    </section>

    <section className="how-v4" id="how"><div className="heading-v4"><span>{ar ? "كيف تبدأ؟" : "How it works"}</span><h2>{ar ? "3 خطوات فقط" : "Only 3 steps"}</h2></div><div className="steps-v4"><article><b>1</b><UserRound /><h3>{ar ? "اختر حسابك" : "Choose your role"}</h3></article><article><b>2</b><ShieldCheck /><h3>{ar ? "سجّل دخولك" : "Sign in securely"}</h3></article><article><b>3</b><HeartPulse /><h3>{ar ? "ابدأ رعايتك" : "Start your care"}</h3></article></div><button onClick={onLogin}>{ar ? "تسجيل الدخول" : "Sign in"}<Arrow /></button></section>

    <section className="cta-v4"><div><HeartPulse /><span>{ar ? "جاهز تبدأ؟" : "Ready to start?"}</span></div><h2>{ar ? "رعايتك أقرب مع سلامتك" : "Care is closer with Salamtak"}</h2><button onClick={onLogin}>{ar ? "ابدأ الآن" : "Get started"}<Arrow /></button></section>

    <footer className="footer-v4"><div className="brand-lockup"><span className="brand-mark"><HeartPulse /></span><div><strong>سلامتك</strong><small>{ar ? "رعايتك أقرب" : "Care, closer"}</small></div></div><nav><a href="#services">{ar ? "الخدمات" : "Services"}</a><a href="#how">{ar ? "كيف تعمل؟" : "How it works"}</a><button onClick={onLogin}>{ar ? "دخول" : "Sign in"}</button></nav><span>© 2026 Salamtak</span></footer>
  </main>;
}
