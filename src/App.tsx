import { useEffect, useState } from "react";
import { AppProvider, useApp } from "./contexts/AppContext";
import { Header } from "./components/Header";
import { UserTypeSelector } from "./components/UserTypeSelector";
import { AuthPortal } from "./components/AuthPortal";
import { DoctorDashboard } from "./components/DoctorDashboard";
import { PatientDashboard } from "./components/PatientDashboard";
import { DashboardShell } from "./components/DashboardShell";
import { PrescriptionForm } from "./components/PrescriptionForm";
import { AppointmentBooking } from "./components/AppointmentBooking";
import { PatientAppointments } from "./components/PatientAppointments";
import { DoctorPrescriptions } from "./components/DoctorPrescriptions";
import { PatientPrescriptions } from "./components/PatientPrescriptions";
import { DoctorProfileSettings } from "./components/DoctorProfileSettings";
import { MedicationReminder } from "./components/MedicationReminder";
import { PharmacyDelivery } from "./components/PharmacyDelivery";
import { VideoConsultation } from "./components/VideoConsultation";
import { RatingSystem } from "./components/RatingSystem";
import { PatientProfile } from "./components/PatientProfile";
import { DoctorVideoConsultation } from "./components/DoctorVideoConsultation";
import { PatientFiles } from "./components/PatientFiles";
import { HakimAssistant } from "./components/HakimAssistant";
import { TaskModal } from "./components/TaskModal";
import { MobileOptimizer } from "./components/MobileOptimizer";
import { Toaster } from "./components/ui/sonner";
import { ApiUser, api, clearAuthSession, getStoredUser, setAuthSession, updateStoredUser } from "./services/api";

type AppState = "home" | "login" | "doctor-dashboard" | "patient-dashboard" | "appointments" | "prescriptions" | "patient-prescriptions" | "doctor-profile" | "prescription" | "appointment-booking" | "medication-reminder" | "pharmacy-delivery" | "video-consultation" | "doctor-video-consultation" | "rating-system" | "patient-profile" | "patient-files" | "hakim-ai";
type ModalState = "prescription" | "appointment-booking" | null;

function AppContent() {
  const { language } = useApp();
  const storedUser = getStoredUser();
  const publicState = window.location.hash === "#login" ? "login" : "home";
  const [currentState, setCurrentState] = useState<AppState>(storedUser ? (storedUser.role === "doctor" ? "doctor-dashboard" : "patient-dashboard") : publicState);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(storedUser);
  const [restoring, setRestoring] = useState(Boolean(storedUser));
  const [modalState, setModalState] = useState<ModalState>(null);

  useEffect(() => {
    document.querySelector('meta[name="viewport"]')?.setAttribute("content", "width=device-width, initial-scale=1, viewport-fit=cover");
    if (!storedUser) return;
    api.me().then(({ user }) => {
      setCurrentUser(user);
      setCurrentState(user.role === "doctor" ? "doctor-dashboard" : "patient-dashboard");
    }).catch(() => {
      clearAuthSession(); setCurrentUser(null); setCurrentState("home");
    }).finally(() => setRestoring(false));
  }, []);

  useEffect(() => {
    const handleHistory = () => {
      const next = window.location.hash.slice(1) as AppState;
      if (next === "prescription" || next === "appointment-booking") {
        setModalState(next);
        return;
      }
      const publicPage = next === "home" || next === "login";
      if (publicPage || currentUser) setCurrentState(next || "home");
    };
    window.addEventListener("popstate", handleHistory);
    return () => window.removeEventListener("popstate", handleHistory);
  }, [currentUser]);

  const navigate = (state: string) => {
    if (state === "prescription" || state === "appointment-booking") {
      setModalState(state);
      return;
    }
    setModalState(null);
    window.history.pushState(null, "", `#${state}`);
    setCurrentState(state as AppState);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const login = (result: { user: ApiUser; token: string }) => {
    setAuthSession(result); setCurrentUser(result.user);
    const dashboard = result.user.role === "doctor" ? "doctor-dashboard" : "patient-dashboard";
    window.history.replaceState(null, "", `#${dashboard}`); setCurrentState(dashboard);
  };
  const logout = () => { clearAuthSession(); setCurrentUser(null); setModalState(null); window.history.replaceState(null, "", "#home"); setCurrentState("home"); };

  function pageContent() {
    switch (currentState) {
      case "doctor-dashboard": return <DoctorDashboard onLogout={logout} onNavigate={navigate} currentUser={currentUser} />;
      case "patient-dashboard": return <PatientDashboard onLogout={logout} onNavigate={navigate} currentUser={currentUser} />;
      case "appointments": return <PatientAppointments onNavigate={navigate} />;
      case "prescriptions": return <DoctorPrescriptions onNavigate={navigate} />;
      case "patient-prescriptions": return <PatientPrescriptions />;
      case "doctor-profile": return <DoctorProfileSettings onProfileUpdated={(user) => { setCurrentUser(user); updateStoredUser(user); }} />;
      case "medication-reminder": return <MedicationReminder onNavigate={navigate} onBack={() => navigate("patient-dashboard")} />;
      case "pharmacy-delivery": return <PharmacyDelivery onNavigate={navigate} onBack={() => navigate("patient-dashboard")} />;
      case "video-consultation": return <VideoConsultation onNavigate={navigate} onBack={() => navigate("patient-dashboard")} userType="patient" />;
      case "doctor-video-consultation": return <DoctorVideoConsultation onNavigate={navigate} onBack={() => navigate("doctor-dashboard")} />;
      case "rating-system": return <RatingSystem onNavigate={navigate} onBack={() => navigate(currentUser?.role === "doctor" ? "doctor-dashboard" : "patient-dashboard")} />;
      case "patient-profile": return <PatientProfile onNavigate={navigate} onBack={() => navigate("patient-dashboard")} onProfileUpdated={(user) => { setCurrentUser(user); updateStoredUser(user); }} />;
      case "patient-files": return <PatientFiles onNavigate={navigate} onBack={() => navigate("doctor-dashboard")} />;
      case "hakim-ai": return <HakimAssistant />;
      default: return null;
    }
  }

  if (restoring) return <div className="app-loading"><div className="loading-spinner" /></div>;
  if (currentState === "home") return <><Header onLogin={() => navigate("login")} /><UserTypeSelector onLogin={() => navigate("login")} /><Toaster /></>;
  if (currentState === "login") return <><AuthPortal onBack={() => navigate("home")} onLogin={login} /><Toaster /></>;

  if (!currentUser || (currentUser.role !== "patient" && currentUser.role !== "doctor")) {
    clearAuthSession(); return <><Header onLogin={() => navigate("login")} /><UserTypeSelector onLogin={() => navigate("login")} /></>;
  }

  return <DashboardShell role={currentUser.role} user={currentUser} activeState={modalState || currentState} onLogout={logout} onNavigate={navigate}>
    {pageContent()}
    {modalState === "prescription" && <TaskModal title={language === "ar" ? "روشتة جديدة" : "New prescription"} description={language === "ar" ? "اكتب التشخيص وخطة العلاج بدون مغادرة لوحة التحكم" : "Create the diagnosis and treatment plan without leaving the dashboard"} onClose={() => setModalState(null)}><PrescriptionForm onNavigate={navigate} onBack={() => setModalState(null)} /></TaskModal>}
    {modalState === "appointment-booking" && <TaskModal title={language === "ar" ? "حجز موعد جديد" : "Book an appointment"} description={language === "ar" ? "اختر الطبيب والموعد المناسب" : "Choose a doctor and a suitable time"} size="wide" onClose={() => setModalState(null)}><AppointmentBooking onNavigate={navigate} onBack={() => setModalState(null)} /></TaskModal>}
    <Toaster />
  </DashboardShell>;
}

export default function App() { return <AppProvider><MobileOptimizer><AppContent /></MobileOptimizer></AppProvider>; }
