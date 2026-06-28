import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, Check, CheckCircle2, Clock3, Pause, Pill, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useApp } from "../contexts/AppContext";
import { api } from "../services/api";
import { useAsyncData } from "../hooks/useAsyncData";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

interface MedicationSchedule { id: string; medicationName: string; dosage: string; times: string[]; isActive: boolean; nextDose: Date; takenToday: string[] }
interface Reminder { id: string; type: "medication" | "appointment"; title: string; message: string; time: Date; isRead: boolean }
interface Props { onNavigate?: (state: string) => void; onBack?: () => void }

export function MedicationReminder(_props: Props) {
  const { dir, language } = useApp();
  const ar = language === "ar";
  const { data: scheduleData, setData: setScheduleData, isLoading, error } = useAsyncData(() => api.medicationSchedules(), []);
  const { data: reminderData, setData: setReminderData } = useAsyncData(() => api.reminders(), []);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newMedication, setNewMedication] = useState({ name: "", dosage: "", times: ["08:00"] });

  const schedules: MedicationSchedule[] = useMemo(() => (scheduleData || []).map((schedule: any) => ({
    id: schedule._id, medicationName: schedule.medicationName, dosage: schedule.dosage,
    times: schedule.times || [], isActive: schedule.isActive,
    nextDose: schedule.nextDose ? new Date(schedule.nextDose) : new Date(), takenToday: schedule.takenToday || [],
  })), [scheduleData]);
  const reminders: Reminder[] = useMemo(() => (reminderData || []).map((reminder: any) => ({
    id: reminder._id, type: reminder.type, title: reminder.title, message: reminder.message,
    time: new Date(reminder.time), isRead: reminder.isRead,
  })), [reminderData]);
  const activeSchedules = schedules.filter((schedule) => schedule.isActive);
  const totalDoses = activeSchedules.reduce((total, schedule) => total + schedule.times.length, 0);
  const takenDoses = activeSchedules.reduce((total, schedule) => total + schedule.times.filter((time) => schedule.takenToday.includes(time)).length, 0);
  const adherence = totalDoses ? Math.round((takenDoses / totalDoses) * 100) : 0;
  const nextSchedule = [...activeSchedules].sort((a, b) => a.nextDose.getTime() - b.nextDose.getTime())[0];
  const unreadReminders = reminders.filter((reminder) => !reminder.isRead);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const due = schedules.find((schedule) => schedule.isActive && schedule.nextDose <= new Date());
      if (due) toast(ar ? `حان وقت تناول ${due.medicationName}` : `Time to take ${due.medicationName}`, { description: `${ar ? "الجرعة" : "Dose"}: ${due.dosage}` });
    }, 60000);
    return () => window.clearInterval(interval);
  }, [schedules, ar]);

  function getNextDoseTime(times: string[]) {
    const now = new Date();
    for (const time of [...times].sort()) {
      const [hours, minutes] = time.split(":").map(Number);
      const dose = new Date(); dose.setHours(hours, minutes, 0, 0);
      if (dose > now) return dose;
    }
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const [hours, minutes] = (times[0] || "08:00").split(":").map(Number); tomorrow.setHours(hours, minutes, 0, 0);
    return tomorrow;
  }

  async function addMedication() {
    if (!newMedication.name.trim() || !newMedication.dosage.trim() || !newMedication.times.length) return;
    setSaving(true);
    try {
      const created = await api.createMedicationSchedule({ medicationName: newMedication.name.trim(), dosage: newMedication.dosage.trim(), times: newMedication.times, isActive: true, nextDose: getNextDoseTime(newMedication.times), takenToday: [] });
      setScheduleData([...(scheduleData || []), created]);
      setNewMedication({ name: "", dosage: "", times: ["08:00"] }); setShowAdd(false);
      toast.success(ar ? "تمت إضافة الدواء إلى جدولك" : "Medication added to your schedule");
    } catch (addError) { toast.error(addError instanceof Error ? addError.message : (ar ? "تعذر إضافة الدواء" : "Unable to add medication")); }
    finally { setSaving(false); }
  }

  async function toggleSchedule(schedule: MedicationSchedule) {
    try {
      const updated = await api.updateMedicationSchedule(schedule.id, { isActive: !schedule.isActive });
      setScheduleData((scheduleData || []).map((item: any) => item._id === schedule.id ? updated : item));
    } catch (toggleError) { toast.error(toggleError instanceof Error ? toggleError.message : "Error"); }
  }

  async function markAsTaken(schedule: MedicationSchedule, time: string) {
    if (schedule.takenToday.includes(time)) return;
    try {
      const updated = await api.updateMedicationSchedule(schedule.id, { takenToday: [...schedule.takenToday, time], nextDose: getNextDoseTime(schedule.times) });
      setScheduleData((scheduleData || []).map((item: any) => item._id === schedule.id ? updated : item));
      toast.success(ar ? "تم تسجيل الجرعة" : "Dose marked as taken");
    } catch (takeError) { toast.error(takeError instanceof Error ? takeError.message : "Error"); }
  }

  async function deleteSchedule(id: string) {
    try { await api.deleteMedicationSchedule(id); setScheduleData((scheduleData || []).filter((item: any) => item._id !== id)); toast.success(ar ? "تم حذف الدواء" : "Medication removed"); }
    catch (deleteError) { toast.error(deleteError instanceof Error ? deleteError.message : "Error"); }
  }

  async function readReminder(id: string) {
    try { const updated = await api.markReminderRead(id); setReminderData((reminderData || []).map((item: any) => item._id === id ? updated : item)); }
    catch { /* keep notification available if the request fails */ }
  }

  function setFrequency(count: number) {
    const presets: Record<number, string[]> = { 1: ["08:00"], 2: ["08:00", "20:00"], 3: ["08:00", "14:00", "20:00"], 4: ["08:00", "12:00", "16:00", "20:00"] };
    setNewMedication((current) => ({ ...current, times: presets[count] }));
  }

  return <div className="medication-v2" dir={dir}>
    <header className="medication-v2-head"><div><span>{ar ? "جدول علاجي واضح" : "A clear treatment schedule"}</span><h2>{ar ? "أدويتي اليومية" : "My daily medication"}</h2><p>{ar ? "اعرف جرعتك القادمة وسجّل ما تناولته من مكان واحد." : "See your next dose and track what you have taken in one place."}</p></div><button onClick={() => setShowAdd(true)}><Plus />{ar ? "إضافة دواء" : "Add medication"}</button></header>

    <section className="medication-summary">
      <div><span><Pill /></span><p><b>{activeSchedules.length}</b><small>{ar ? "أدوية نشطة" : "Active medications"}</small></p></div>
      <div><span><CheckCircle2 /></span><p><b>{takenDoses}/{totalDoses}</b><small>{ar ? "جرعات اليوم" : "Today's doses"}</small></p></div>
      <div><span><CalendarDays /></span><p><b>{adherence}%</b><small>{ar ? "الالتزام اليومي" : "Daily adherence"}</small></p></div>
    </section>

    <div className="medication-layout">
      <main className="medication-board"><header><div><Pill /><span><b>{ar ? "جدول الأدوية" : "Medication schedule"}</b><small>{ar ? "اضغط على موعد الجرعة لتسجيلها" : "Select a dose time to mark it taken"}</small></span></div><i>{schedules.length} {ar ? "دواء" : "medications"}</i></header>
        <div className="medication-list">
          {isLoading && <div className="medication-empty"><div className="loading-spinner" /><p>{ar ? "جاري تحميل جدولك..." : "Loading your schedule..."}</p></div>}
          {error && <div className="medication-empty error"><p>{error}</p></div>}
          {!isLoading && !error && schedules.map((schedule) => <article key={schedule.id} className={!schedule.isActive ? "paused" : ""}>
            <div className="medication-main"><span><Pill /></span><div><div className="medication-name-line"><h3>{schedule.medicationName}</h3><i className={schedule.isActive ? "active" : ""}>{schedule.isActive ? (ar ? "نشط" : "Active") : (ar ? "متوقف" : "Paused")}</i></div><p>{schedule.dosage}</p><small><Clock3 />{ar ? "الجرعات المحددة" : "Scheduled doses"}: {schedule.times.length}</small></div></div>
            <div className="dose-times">{schedule.times.map((time) => { const done = schedule.takenToday.includes(time); return <button key={time} className={done ? "done" : ""} disabled={done || !schedule.isActive} onClick={() => markAsTaken(schedule, time)}><span>{done ? <Check /> : <Clock3 />}</span><b>{time}</b><small>{done ? (ar ? "تم تناولها" : "Taken") : (ar ? "تسجيل الجرعة" : "Mark taken")}</small></button>; })}</div>
            <div className="medication-actions"><button onClick={() => toggleSchedule(schedule)}>{schedule.isActive ? <Pause /> : <CheckCircle2 />}{schedule.isActive ? (ar ? "إيقاف" : "Pause") : (ar ? "تفعيل" : "Activate")}</button><button className="delete" onClick={() => deleteSchedule(schedule.id)} aria-label={ar ? "حذف الدواء" : "Delete medication"}><Trash2 /></button></div>
          </article>)}
          {!isLoading && !error && !schedules.length && <div className="medication-empty"><span><Pill /></span><h3>{ar ? "لم تضف أدوية بعد" : "No medication yet"}</h3><p>{ar ? "أضف أول دواء وحدد مواعيد جرعاته." : "Add your first medication and dose times."}</p><button onClick={() => setShowAdd(true)}><Plus />{ar ? "إضافة دواء" : "Add medication"}</button></div>}
        </div>
      </main>

      <aside className="medication-side">
        <section className="next-dose-card"><header><span>{ar ? "الجرعة القادمة" : "Next dose"}</span><Clock3 /></header>{nextSchedule ? <><div><span><Pill /></span><h3>{nextSchedule.medicationName}</h3><p>{nextSchedule.dosage}</p></div><time>{nextSchedule.nextDose.toLocaleTimeString(ar ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}</time><button onClick={() => markAsTaken(nextSchedule, nextSchedule.nextDose.toTimeString().slice(0, 5))}><Check />{ar ? "تم تناول الجرعة" : "Mark dose as taken"}</button></> : <div className="side-empty">{ar ? "لا توجد جرعات قادمة" : "No upcoming doses"}</div>}</section>
        <section className="medication-notifications"><header><div><Bell /><span><b>{ar ? "التنبيهات" : "Notifications"}</b><small>{unreadReminders.length} {ar ? "غير مقروء" : "unread"}</small></span></div></header><div>{reminders.slice(0, 5).map((reminder) => <button key={reminder.id} className={!reminder.isRead ? "unread" : ""} onClick={() => readReminder(reminder.id)}><span>{reminder.type === "appointment" ? <CalendarDays /> : <Pill />}</span><div><b>{reminder.title}</b><p>{reminder.message}</p><small>{reminder.time.toLocaleDateString(ar ? "ar-EG" : "en-US")}</small></div>{!reminder.isRead && <i />}</button>)}{!reminders.length && <div className="side-empty">{ar ? "لا توجد تنبيهات جديدة" : "No new notifications"}</div>}</div></section>
      </aside>
    </div>

    <Dialog open={showAdd} onOpenChange={setShowAdd}><DialogContent className="medication-dialog" dir={dir}><DialogHeader><DialogTitle>{ar ? "إضافة دواء جديد" : "Add new medication"}</DialogTitle><DialogDescription>{ar ? "أدخل اسم الدواء والجرعة ثم اختر عدد مرات تناوله." : "Enter medication, dose and how many times you take it."}</DialogDescription></DialogHeader><div className="medication-form"><label><span>{ar ? "اسم الدواء" : "Medication name"}</span><input value={newMedication.name} onChange={(event) => setNewMedication((current) => ({ ...current, name: event.target.value }))} placeholder={ar ? "مثال: أسبرين" : "e.g. Aspirin"} /></label><label><span>{ar ? "الجرعة" : "Dosage"}</span><input value={newMedication.dosage} onChange={(event) => setNewMedication((current) => ({ ...current, dosage: event.target.value }))} placeholder={ar ? "مثال: قرص واحد" : "e.g. One tablet"} /></label><div className="frequency-picker"><span>{ar ? "عدد المرات يوميًا" : "Times per day"}</span><div>{[1,2,3,4].map((count) => <button key={count} className={newMedication.times.length === count ? "active" : ""} onClick={() => setFrequency(count)}>{count}</button>)}</div></div><div className="time-fields"><span>{ar ? "مواعيد الجرعات" : "Dose times"}</span><div>{newMedication.times.map((time, index) => <label key={index}><Clock3 /><input type="time" value={time} onChange={(event) => setNewMedication((current) => ({ ...current, times: current.times.map((item, itemIndex) => itemIndex === index ? event.target.value : item) }))} /></label>)}</div></div><button className="medication-submit" disabled={saving || !newMedication.name.trim() || !newMedication.dosage.trim()} onClick={addMedication}><Plus />{saving ? (ar ? "جارٍ الإضافة..." : "Adding...") : (ar ? "إضافة إلى الجدول" : "Add to schedule")}</button></div></DialogContent></Dialog>
  </div>;
}
