import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, MapPin, Plus, Stethoscope, UserRound, Video, XCircle } from "lucide-react";
import { api } from "../services/api";
import { useAsyncData } from "../hooks/useAsyncData";
import { useApp } from "../contexts/AppContext";
import { toast } from "sonner@2.0.3";

interface Props { onNavigate?: (state: string) => void }
type Filter = "upcoming" | "past" | "cancelled";

export function PatientAppointments({ onNavigate }: Props) {
  const { language, dir } = useApp();
  const ar = language === "ar";
  const [filter, setFilter] = useState<Filter>("upcoming");
  const { data, setData, isLoading, error } = useAsyncData(() => api.appointments(), []);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const groups = useMemo(() => {
    const items = data || [];
    return {
      upcoming: items.filter((item: any) => new Date(item.date) >= today && !["completed", "cancelled"].includes(item.status)),
      past: items.filter((item: any) => new Date(item.date) < today || item.status === "completed"),
      cancelled: items.filter((item: any) => item.status === "cancelled"),
    };
  }, [data]);

  async function cancelAppointment(id: string) {
    try {
      const updated = await api.updateAppointment(id, { status: "cancelled" });
      setData((data || []).map((item: any) => item._id === id ? { ...item, ...updated } : item));
      toast.success(ar ? "تم إلغاء الموعد" : "Appointment cancelled");
    } catch (error) { toast.error(error instanceof Error ? error.message : (ar ? "تعذر إلغاء الموعد" : "Unable to cancel appointment")); }
  }

  const statusLabel = (status: string) => ({ pending: ar ? "بانتظار التأكيد" : "Pending", confirmed: ar ? "مؤكد" : "Confirmed", waiting: ar ? "في الانتظار" : "Waiting", completed: ar ? "مكتمل" : "Completed", cancelled: ar ? "ملغي" : "Cancelled" }[status] || status);
  const selected = groups[filter];

  return <div className="appointments-page" dir={dir}>
    <header className="appointments-page-head"><div><span>{ar ? "إدارة المواعيد" : "Appointment management"}</span><h2>{ar ? "مواعيدي" : "My appointments"}</h2><p>{ar ? "تابع زياراتك القادمة وراجع سجل مواعيدك السابقة." : "Track upcoming visits and review your appointment history."}</p></div><button onClick={() => onNavigate?.("appointment-booking")}><Plus />{ar ? "إضافة موعد جديد" : "New appointment"}</button></header>

    <section className="appointments-summary"><div><span><CalendarDays /></span><p><b>{groups.upcoming.length}</b><small>{ar ? "مواعيد قادمة" : "Upcoming"}</small></p></div><div><span><CheckCircle2 /></span><p><b>{groups.past.length}</b><small>{ar ? "زيارات سابقة" : "Past visits"}</small></p></div><div><span><XCircle /></span><p><b>{groups.cancelled.length}</b><small>{ar ? "مواعيد ملغاة" : "Cancelled"}</small></p></div></section>

    <section className="appointments-board"><div className="appointments-tabs" role="tablist"><button className={filter === "upcoming" ? "active" : ""} onClick={() => setFilter("upcoming")}>{ar ? "القادمة" : "Upcoming"}<b>{groups.upcoming.length}</b></button><button className={filter === "past" ? "active" : ""} onClick={() => setFilter("past")}>{ar ? "السابقة" : "Past"}<b>{groups.past.length}</b></button><button className={filter === "cancelled" ? "active" : ""} onClick={() => setFilter("cancelled")}>{ar ? "الملغاة" : "Cancelled"}<b>{groups.cancelled.length}</b></button></div>
      <div className="appointments-list">
        {isLoading && <div className="appointments-empty"><div className="loading-spinner" /><p>{ar ? "جارٍ تحميل المواعيد..." : "Loading appointments..."}</p></div>}
        {error && <div className="appointments-empty"><XCircle /><h3>{ar ? "تعذر تحميل المواعيد" : "Unable to load appointments"}</h3><p>{error}</p></div>}
        {!isLoading && !error && selected.map((appointment: any) => {
          const date = new Date(appointment.date);
          const isVideo = appointment.type === "video";
          return <article className="appointment-card-v2" key={appointment._id}>
            <div className="appointment-date-box"><b>{date.toLocaleDateString(ar ? "ar-EG" : "en-US", { day: "2-digit" })}</b><span>{date.toLocaleDateString(ar ? "ar-EG" : "en-US", { month: "short" })}</span><small>{date.toLocaleDateString(ar ? "ar-EG" : "en-US", { weekday: "short" })}</small></div>
            <div className="appointment-doctor-avatar">{appointment.doctor?.name?.slice(0, 1) || <UserRound />}</div>
            <div className="appointment-main-info"><div><h3>{appointment.doctor?.name || (ar ? "الطبيب" : "Doctor")}</h3><span>{appointment.doctorProfile?.specialty || (ar ? "تخصص عام" : "General practice")}</span></div><div className="appointment-details"><span><Clock3 />{appointment.time}</span><span>{isVideo ? <Video /> : <MapPin />}{isVideo ? (ar ? "استشارة مرئية" : "Video consultation") : appointment.clinic || (ar ? "زيارة عيادة" : "Clinic visit")}</span></div></div>
            <div className="appointment-card-actions"><span className={`appointment-status status-${appointment.status}`}>{statusLabel(appointment.status)}</span>{filter === "upcoming" && <><button className="appointment-secondary" onClick={() => cancelAppointment(appointment._id)}>{ar ? "إلغاء" : "Cancel"}</button>{isVideo && <button className="appointment-primary" onClick={() => onNavigate?.("video-consultation")}><Video />{ar ? "دخول" : "Join"}</button>}</>}</div>
          </article>;
        })}
        {!isLoading && !error && selected.length === 0 && <div className="appointments-empty"><span><CalendarDays /></span><h3>{filter === "upcoming" ? (ar ? "لا توجد مواعيد قادمة" : "No upcoming appointments") : filter === "past" ? (ar ? "لا توجد زيارات سابقة" : "No past visits") : (ar ? "لا توجد مواعيد ملغاة" : "No cancelled appointments")}</h3><p>{filter === "upcoming" ? (ar ? "احجز موعدًا جديدًا مع الطبيب المناسب." : "Book a new visit with the right doctor.") : (ar ? "ستظهر المواعيد هنا عند توفرها." : "Appointments will appear here when available.")}</p>{filter === "upcoming" && <button onClick={() => onNavigate?.("appointment-booking")}><Plus />{ar ? "حجز موعد" : "Book appointment"}</button>}</div>}
      </div>
    </section>
  </div>;
}
