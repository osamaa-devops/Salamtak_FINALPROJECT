import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, MapPin, Star, Stethoscope, UserRound, Video } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useApp } from "../contexts/AppContext";
import { api } from "../services/api";
import { useAsyncData } from "../hooks/useAsyncData";

interface Doctor {
  id: string; name: string; specialty: string; rating: number; experience: number; clinic: string; address: string; fee: number; availableSlots: string[]; consultationType: "clinic" | "video" | "both";
}
interface Props { onNavigate?: (state: string) => void; onBack?: () => void }

export function AppointmentBooking({ onBack }: Props) {
  const { language, dir } = useApp();
  const ar = language === "ar";
  const Forward = ar ? ArrowLeft : ArrowRight;
  const Back = ar ? ArrowRight : ArrowLeft;
  const [step, setStep] = useState(1);
  const [specialty, setSpecialty] = useState("all");
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<"consultation" | "video">("consultation");
  const [symptoms, setSymptoms] = useState("");
  const [busy, setBusy] = useState(false);
  const { data, isLoading, error } = useAsyncData(() => api.doctors(), []);

  const doctors: Doctor[] = (data || []).map((item: any) => ({ id: item.user?._id, name: item.user?.name || "", specialty: item.specialty || "", rating: item.rating || 0, experience: item.experience || 0, clinic: item.clinic || "", address: item.address || "", fee: item.fee || 0, availableSlots: item.availableSlots || [], consultationType: item.consultationType || "clinic" }));
  const specialties = useMemo(() => Array.from(new Set(doctors.map(item => item.specialty).filter(Boolean))), [data]);
  const filteredDoctors = specialty === "all" ? doctors : doctors.filter(item => item.specialty === specialty);
  const minDate = new Date().toISOString().slice(0, 10);

  function selectDoctor(item: Doctor) {
    setDoctor(item); setTime("");
    setType(item.consultationType === "video" ? "video" : "consultation");
  }

  async function book() {
    if (!doctor || !date || !time) return;
    setBusy(true);
    try {
      await api.createAppointment({ doctor: doctor.id, date: new Date(`${date}T12:00:00`).toISOString(), time, type, symptoms });
      toast.success(ar ? "تم إرسال الحجز للطبيب" : "Appointment request sent");
      window.setTimeout(() => onBack?.(), 650);
    } catch (error) { toast.error(error instanceof Error ? error.message : (ar ? "تعذر حجز الموعد" : "Unable to book appointment")); }
    finally { setBusy(false); }
  }

  return <div className="booking-v2" dir={dir}>
    <div className="booking-steps"><div className={step >= 1 ? "active" : ""}><span>{step > 1 ? <Check /> : "1"}</span><b>{ar ? "الطبيب" : "Doctor"}</b></div><i className={step > 1 ? "active" : ""}></i><div className={step >= 2 ? "active" : ""}><span>{step > 2 ? <Check /> : "2"}</span><b>{ar ? "الموعد" : "Time"}</b></div><i className={step > 2 ? "active" : ""}></i><div className={step >= 3 ? "active" : ""}><span>3</span><b>{ar ? "التأكيد" : "Confirm"}</b></div></div>

    {step === 1 && <section className="booking-step booking-doctor-step">
      <div className="booking-section-title"><span><Stethoscope /></span><div><h3>{ar ? "اختر الطبيب المناسب" : "Choose the right doctor"}</h3><p>{ar ? "يمكنك التصفية حسب التخصص." : "Filter doctors by specialty."}</p></div></div>
      <div className="specialty-chips"><button className={specialty === "all" ? "active" : ""} onClick={() => setSpecialty("all")}>{ar ? "كل التخصصات" : "All specialties"}</button>{specialties.map(item => <button key={item} className={specialty === item ? "active" : ""} onClick={() => setSpecialty(item)}>{item}</button>)}</div>
      {isLoading && <div className="booking-state"><div className="loading-spinner" />{ar ? "جارٍ تحميل الأطباء..." : "Loading doctors..."}</div>}
      {error && <div className="booking-state booking-error">{error}</div>}
      <div className="doctor-picker-grid">{filteredDoctors.map(item => <button className={doctor?.id === item.id ? "doctor-pick-card selected" : "doctor-pick-card"} key={item.id} onClick={() => selectDoctor(item)}><span className="doctor-pick-avatar">{item.name.slice(0, 1) || <UserRound />}</span><div className="doctor-pick-info"><h4>{item.name}</h4><p>{item.specialty}</p><div><span><Star />{item.rating}</span><span>{item.experience} {ar ? "سنوات خبرة" : "years"}</span></div></div><div className="doctor-pick-price"><b>{item.fee}</b><small>{ar ? "ج.م" : "EGP"}</small></div><span className="doctor-pick-check"><Check /></span></button>)}</div>
      {!isLoading && !error && filteredDoctors.length === 0 && <div className="booking-state">{ar ? "لا يوجد أطباء في هذا التخصص حاليًا" : "No doctors in this specialty yet"}</div>}
    </section>}

    {step === 2 && doctor && <section className="booking-step booking-time-step">
      <div className="selected-doctor-strip"><span>{doctor.name.slice(0, 1)}</span><div><small>{ar ? "الموعد مع" : "Appointment with"}</small><b>{doctor.name}</b><p>{doctor.specialty}</p></div><button onClick={() => setStep(1)}>{ar ? "تغيير" : "Change"}</button></div>
      <div className="booking-time-grid"><div className="booking-field-card"><div className="booking-section-title"><span><CalendarDays /></span><div><h3>{ar ? "اختر التاريخ" : "Choose a date"}</h3><p>{ar ? "حدد اليوم المناسب لك." : "Pick a suitable day."}</p></div></div><input className="booking-date-input" type="date" min={minDate} value={date} onChange={event => { setDate(event.target.value); setTime(""); }} /></div>
        <div className="booking-field-card"><div className="booking-section-title"><span><Clock3 /></span><div><h3>{ar ? "اختر الوقت" : "Choose a time"}</h3><p>{date ? (ar ? "الأوقات المتاحة لهذا الطبيب." : "Available doctor slots.") : (ar ? "اختر التاريخ أولًا." : "Select a date first.")}</p></div></div><div className="time-slot-grid">{doctor.availableSlots.map(slot => <button disabled={!date} className={time === slot ? "active" : ""} key={slot} onClick={() => setTime(slot)}>{slot}</button>)}</div></div></div>
      <div className="appointment-type-picker"><button className={type === "consultation" ? "active" : ""} disabled={doctor.consultationType === "video"} onClick={() => setType("consultation")}><MapPin /><span><b>{ar ? "زيارة العيادة" : "Clinic visit"}</b><small>{doctor.clinic}</small></span><i><Check /></i></button><button className={type === "video" ? "active" : ""} disabled={doctor.consultationType === "clinic"} onClick={() => setType("video")}><Video /><span><b>{ar ? "استشارة مرئية" : "Video consultation"}</b><small>{ar ? "من مكانك" : "From anywhere"}</small></span><i><Check /></i></button></div>
    </section>}

    {step === 3 && doctor && <section className="booking-step booking-confirm-step">
      <div className="booking-confirm-main"><div className="booking-section-title"><span><Check /></span><div><h3>{ar ? "راجع تفاصيل الموعد" : "Review appointment details"}</h3><p>{ar ? "تأكد من البيانات قبل إرسال الحجز." : "Check the details before submitting."}</p></div></div><div className="booking-summary"><div><span>{ar ? "الطبيب" : "Doctor"}</span><b>{doctor.name}</b><small>{doctor.specialty}</small></div><div><span>{ar ? "التاريخ والوقت" : "Date and time"}</span><b>{new Date(`${date}T12:00:00`).toLocaleDateString(ar ? "ar-EG" : "en-US", { weekday: "long", day: "numeric", month: "long" })}</b><small>{time}</small></div><div><span>{ar ? "نوع الموعد" : "Appointment type"}</span><b>{type === "video" ? (ar ? "استشارة مرئية" : "Video consultation") : (ar ? "زيارة العيادة" : "Clinic visit")}</b><small>{type === "video" ? (ar ? "أونلاين" : "Online") : doctor.clinic}</small></div><div><span>{ar ? "رسوم الكشف" : "Consultation fee"}</span><b>{doctor.fee} {ar ? "ج.م" : "EGP"}</b></div></div></div>
      <label className="symptoms-field"><span>{ar ? "الأعراض أو سبب الزيارة" : "Symptoms or visit reason"}<small>{ar ? "اختياري" : "Optional"}</small></span><textarea rows={5} value={symptoms} onChange={event => setSymptoms(event.target.value)} placeholder={ar ? "اكتب وصفًا مختصرًا يساعد الطبيب..." : "Add a short note to help the doctor..."} /></label>
    </section>}

    <footer className="booking-footer"><button className="booking-back-button" onClick={() => step === 1 ? onBack?.() : setStep(value => value - 1)}><Back />{step === 1 ? (ar ? "إلغاء" : "Cancel") : (ar ? "السابق" : "Back")}</button><div><span>{ar ? `الخطوة ${step} من 3` : `Step ${step} of 3`}</span>{step < 3 ? <button className="booking-next-button" disabled={(step === 1 && !doctor) || (step === 2 && (!date || !time))} onClick={() => setStep(value => value + 1)}>{ar ? "التالي" : "Continue"}<Forward /></button> : <button className="booking-next-button" disabled={busy} onClick={book}>{busy ? (ar ? "جارٍ الحجز..." : "Booking...") : (ar ? "تأكيد الحجز" : "Confirm booking")}<Check /></button>}</div></footer>
  </div>;
}
