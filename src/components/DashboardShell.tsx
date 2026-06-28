import { ReactNode } from "react";
import { Bell, Bot, CalendarDays, FileText, HeartPulse, Languages, LayoutDashboard, LogOut, Moon, Pill, Settings, ShoppingBag, Star, Stethoscope, Sun, UserRound, UsersRound, Video } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { ApiUser } from "../services/api";
import { HakimFloatingChat } from "./HakimFloatingChat";

interface Props {
  role: "patient" | "doctor";
  user?: ApiUser | null;
  activeState: string;
  children: ReactNode;
  onLogout: () => void;
  onNavigate: (state: string) => void;
}

export function DashboardShell({ role, user, activeState, children, onLogout, onNavigate }: Props) {
  const { language, theme, toggleLanguage, toggleTheme, dir } = useApp();
  const ar = language === "ar";
  const patientNav = [
    { label: ar ? "الرئيسية" : "Overview", icon: LayoutDashboard, state: "patient-dashboard" },
    { label: ar ? "المواعيد" : "Appointments", icon: CalendarDays, state: "appointments" },
    { label: ar ? "روشتاتي" : "Prescriptions", icon: FileText, state: "patient-prescriptions" },
    { label: ar ? "الأدوية" : "Medication", icon: Pill, state: "medication-reminder" },
    { label: ar ? "استشارة مرئية" : "Video consult", icon: Video, state: "video-consultation" },
    { label: ar ? "الصيدلية" : "Pharmacy", icon: ShoppingBag, state: "pharmacy-delivery" },
    { label: ar ? "ملفي الصحي" : "Health profile", icon: UserRound, state: "patient-profile" },
    { label: ar ? "حكيم AI" : "Hakim AI", icon: Bot, state: "hakim-ai" },
  ];
  const doctorNav = [
    { label: ar ? "الرئيسية" : "Overview", icon: LayoutDashboard, state: "doctor-dashboard" },
    { label: ar ? "ملفات المرضى" : "Patients", icon: UsersRound, state: "patient-files" },
    { label: ar ? "الاستشارات" : "Consultations", icon: Video, state: "doctor-video-consultation" },
    { label: ar ? "الروشتات" : "Prescriptions", icon: Stethoscope, state: "prescriptions" },
    { label: ar ? "التقييمات" : "Reviews", icon: Star, state: "rating-system" },
  ];
  const nav = role === "patient" ? patientNav : doctorNav;
  const pageTitle = nav.find((item) => item.state === activeState)?.label
    || (activeState === "doctor-profile" ? (ar ? "الإعدادات والملف الشخصي" : "Profile & settings") : undefined)
    || (ar ? "مساحة سلامتك" : "Salamtak workspace");

  return (
    <div className="app-shell" dir={dir}>
      <aside className="app-sidebar">
        <button className="app-brand" onClick={() => onNavigate(role === "doctor" ? "doctor-dashboard" : "patient-dashboard")}>
          <span><HeartPulse /></span><div><b>سلامتك</b><small>{ar ? "رعاية متصلة" : "Connected care"}</small></div>
        </button>
        <nav aria-label={ar ? "التنقل الرئيسي" : "Main navigation"}>
          {nav.map((item) => <button key={item.state} className={activeState === item.state || (activeState === "appointment-booking" && item.state === "appointments") || (activeState === "prescription" && item.state === "prescriptions") ? "active" : ""} onClick={() => onNavigate(item.state)}><item.icon /><span>{item.label}</span></button>)}
        </nav>
        <div className="sidebar-footer">
          <button onClick={toggleLanguage}><Languages /><span>{ar ? "English" : "العربية"}</span></button>
          <button onClick={toggleTheme}>{theme === "light" ? <Moon /> : <Sun />}<span>{theme === "light" ? (ar ? "الوضع الداكن" : "Dark mode") : (ar ? "الوضع الفاتح" : "Light mode")}</span></button>
          {role === "doctor" && <button onClick={() => onNavigate("doctor-profile")}><Settings /><span>{ar ? "الإعدادات" : "Settings"}</span></button>}
        </div>
        <div className="sidebar-user"><span>{(user?.name || "U").slice(0, 1)}</span><div><b>{user?.name}</b><small>{role === "doctor" ? (ar ? "حساب طبيب" : "Doctor account") : (ar ? "حساب مريض" : "Patient account")}</small></div><button onClick={onLogout} aria-label={ar ? "تسجيل الخروج" : "Sign out"}><LogOut /></button></div>
      </aside>
      <section className="app-main">
        <header className="app-topbar"><div><span className="mobile-brand"><HeartPulse /></span><div><h1>{pageTitle}</h1><p>{ar ? "رعاية واضحة، وخطوات أسهل" : "Clear care, easier next steps"}</p></div></div><div className="top-actions"><button onClick={toggleTheme} aria-label="theme">{theme === "light" ? <Moon /> : <Sun />}</button><button aria-label="notifications"><Bell /><i /></button></div></header>
        <div className="app-page" key={activeState}>{children}</div>
      </section>
      {role === "patient" && <HakimFloatingChat onOpenPage={() => onNavigate("hakim-ai")} />}
    </div>
  );
}
