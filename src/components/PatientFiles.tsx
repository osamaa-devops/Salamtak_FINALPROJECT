import { useMemo, useState } from "react";
import {
  Activity, AlertCircle, CalendarDays, ChevronLeft, ChevronRight, Clock3,
  FileText, FolderOpen, HeartPulse, Phone, Search, ShieldCheck, UserRound, UsersRound,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { api } from "../services/api";
import { useAsyncData } from "../hooks/useAsyncData";
import { TaskModal } from "./TaskModal";

interface Props { onNavigate?: (state: string) => void; onBack?: () => void }
type Filter = "all" | "attention" | "stable";

interface PatientFile {
  id: string; patientName: string; initials: string; age: number | string; lastVisit: string;
  condition: string; visits: number; phone: string; status: string; nextAppointment: string;
  address: string; bloodType: string; gender: string; medicalHistory: any[]; allergies: string[]; healthMetrics: any[];
}

export function PatientFiles(_props: Props) {
  const { language, dir } = useApp();
  const ar = language === "ar";
  const Arrow = ar ? ChevronLeft : ChevronRight;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedPatient, setSelectedPatient] = useState<PatientFile | null>(null);
  const { data, isLoading, error } = useAsyncData(() => api.patients(), []);

  const patients: PatientFile[] = useMemo(() => (data || []).map((patient: any) => {
    const name = patient.user?.name || (ar ? "مريض بدون اسم" : "Unnamed patient");
    return {
      id: patient._id,
      patientName: name,
      initials: name.split(" ").map((part: string) => part[0]).join("").slice(0, 2),
      age: patient.birthDate ? new Date().getFullYear() - new Date(patient.birthDate).getFullYear() : "-",
      lastVisit: patient.lastVisit ? String(patient.lastVisit).slice(0, 10) : "-",
      condition: patient.condition || (ar ? "متابعة عامة" : "General follow-up"),
      visits: patient.visits || 0,
      phone: patient.user?.phone || "-",
      status: patient.status || "healthy",
      nextAppointment: patient.nextAppointment ? String(patient.nextAppointment).slice(0, 10) : "-",
      address: patient.address || "-",
      bloodType: patient.bloodType || "-",
      gender: patient.gender || "-",
      medicalHistory: patient.medicalHistory || [], allergies: patient.allergies || [], healthMetrics: patient.healthMetrics || [],
    };
  }), [data, ar]);

  const attentionCount = patients.filter((patient) => ["monitoring", "critical"].includes(patient.status)).length;
  const stableCount = patients.filter((patient) => ["healthy", "stable"].includes(patient.status)).length;
  const totalVisits = patients.reduce((total, patient) => total + patient.visits, 0);
  const visiblePatients = patients.filter((patient) => {
    const matchesSearch = `${patient.patientName} ${patient.condition} ${patient.phone}`.toLowerCase().includes(search.trim().toLowerCase());
    const matchesFilter = filter === "all" || (filter === "attention" ? ["monitoring", "critical"].includes(patient.status) : ["healthy", "stable"].includes(patient.status));
    return matchesSearch && matchesFilter;
  });

  function statusInfo(status: string) {
    const map: Record<string, { label: string; tone: string }> = {
      healthy: { label: ar ? "جيد" : "Healthy", tone: "healthy" },
      stable: { label: ar ? "مستقر" : "Stable", tone: "stable" },
      monitoring: { label: ar ? "تحت المتابعة" : "Monitoring", tone: "monitoring" },
      critical: { label: ar ? "يحتاج تدخل" : "Needs attention", tone: "critical" },
    };
    return map[status] || { label: ar ? "غير محدد" : "Unknown", tone: "unknown" };
  }

  return <div className="patient-files-v2" dir={dir}>
    <header className="patient-files-v2-head"><div><span>{ar ? "مساحة متابعة المرضى" : "Patient care workspace"}</span><h2>{ar ? "ملفات المرضى" : "Patient records"}</h2><p>{ar ? "اعثر على المريض بسرعة وراجع حالته وتاريخه الطبي من شاشة واحدة." : "Find patients quickly and review their status and medical history in one place."}</p></div><div className="patient-files-head-mark"><UsersRound /><p><b>{patients.length}</b><small>{ar ? "مريض مرتبط بك" : "linked patients"}</small></p></div></header>

    <section className="patient-files-summary-v2">
      <div><span><UsersRound /></span><p><b>{patients.length}</b><small>{ar ? "إجمالي المرضى" : "Total patients"}</small></p></div>
      <div><span><ShieldCheck /></span><p><b>{stableCount}</b><small>{ar ? "حالات مستقرة" : "Stable cases"}</small></p></div>
      <div className={attentionCount ? "attention" : ""}><span><AlertCircle /></span><p><b>{attentionCount}</b><small>{ar ? "تحتاج متابعة" : "Need attention"}</small></p></div>
      <div><span><Activity /></span><p><b>{totalVisits}</b><small>{ar ? "إجمالي الزيارات" : "Total visits"}</small></p></div>
    </section>

    <section className="patient-directory">
      <header className="patient-directory-toolbar">
        <div className="patient-search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={ar ? "ابحث بالاسم أو الحالة أو رقم الهاتف..." : "Search name, condition or phone..."} />{search && <button onClick={() => setSearch("")}>{ar ? "مسح" : "Clear"}</button>}</div>
        <div className="patient-filter" role="tablist"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>{ar ? "الكل" : "All"}<b>{patients.length}</b></button><button className={filter === "stable" ? "active" : ""} onClick={() => setFilter("stable")}>{ar ? "مستقرة" : "Stable"}<b>{stableCount}</b></button><button className={filter === "attention" ? "active" : ""} onClick={() => setFilter("attention")}>{ar ? "تحتاج متابعة" : "Attention"}<b>{attentionCount}</b></button></div>
      </header>

      <div className="patient-table-head"><span>{ar ? "المريض" : "Patient"}</span><span>{ar ? "الحالة الحالية" : "Current condition"}</span><span>{ar ? "آخر زيارة" : "Last visit"}</span><span>{ar ? "الموعد القادم" : "Next appointment"}</span><span>{ar ? "الحالة" : "Status"}</span><span /></div>
      <div className="patient-directory-list">
        {isLoading && <div className="patient-directory-empty"><div className="loading-spinner" /><p>{ar ? "جاري تحميل ملفات المرضى..." : "Loading patient records..."}</p></div>}
        {error && <div className="patient-directory-empty error"><AlertCircle /><h3>{ar ? "تعذر تحميل الملفات" : "Unable to load records"}</h3><p>{error}</p></div>}
        {!isLoading && !error && visiblePatients.map((patient) => { const status = statusInfo(patient.status); return <article key={patient.id} onClick={() => setSelectedPatient(patient)}>
          <div className="patient-identity"><span>{patient.initials || <UserRound />}</span><p><b>{patient.patientName}</b><small><Phone />{patient.phone} <i>•</i> {patient.age} {ar ? "سنة" : "years"}</small></p></div>
          <div className="patient-condition"><HeartPulse /><p><b>{patient.condition}</b><small>{patient.visits} {ar ? "زيارة مسجلة" : "recorded visits"}</small></p></div>
          <div className="patient-date"><CalendarDays /><span><b>{patient.lastVisit}</b><small>{ar ? "آخر تواصل" : "Last contact"}</small></span></div>
          <div className="patient-date"><Clock3 /><span><b>{patient.nextAppointment}</b><small>{ar ? "موعد قادم" : "Upcoming"}</small></span></div>
          <span className={`patient-status ${status.tone}`}><i />{status.label}</span>
          <div className="patient-row-actions"><a href={patient.phone !== "-" ? `tel:${patient.phone}` : undefined} onClick={(event) => event.stopPropagation()} aria-label={ar ? "اتصال" : "Call"}><Phone /></a><button onClick={(event) => { event.stopPropagation(); setSelectedPatient(patient); }}><FileText />{ar ? "فتح الملف" : "Open record"}<Arrow /></button></div>
        </article>; })}
        {!isLoading && !error && !visiblePatients.length && <div className="patient-directory-empty"><span><FolderOpen /></span><h3>{ar ? "لا توجد نتائج مطابقة" : "No matching patients"}</h3><p>{ar ? "جرّب تغيير البحث أو الفلتر المستخدم." : "Try changing your search or filter."}</p></div>}
      </div>
    </section>

    {selectedPatient && <TaskModal title={ar ? `ملف ${selectedPatient.patientName}` : `${selectedPatient.patientName}'s record`} description={selectedPatient.condition} size="wide" onClose={() => setSelectedPatient(null)}><div className="patient-record-v2">
      <header><div className="record-person"><span>{selectedPatient.initials}</span><div><small>{ar ? "ملف مريض" : "Patient record"}</small><h2>{selectedPatient.patientName}</h2><p><Phone />{selectedPatient.phone}<i>•</i><UserRound />{selectedPatient.age} {ar ? "سنة" : "years"}</p></div></div><span className={`patient-status ${statusInfo(selectedPatient.status).tone}`}><i />{statusInfo(selectedPatient.status).label}</span></header>
      <section className="record-overview"><div><small>{ar ? "فصيلة الدم" : "Blood type"}</small><b>{selectedPatient.bloodType}</b></div><div><small>{ar ? "عدد الزيارات" : "Visits"}</small><b>{selectedPatient.visits}</b></div><div><small>{ar ? "آخر زيارة" : "Last visit"}</small><b>{selectedPatient.lastVisit}</b></div><div><small>{ar ? "الموعد القادم" : "Next visit"}</small><b>{selectedPatient.nextAppointment}</b></div></section>
      <div className="record-grid"><section className="record-history"><header><Activity /><div><h3>{ar ? "التاريخ المرضي" : "Medical history"}</h3><p>{ar ? "الحالات والعلاجات المسجلة" : "Recorded conditions and treatments"}</p></div></header><div>{selectedPatient.medicalHistory.length ? selectedPatient.medicalHistory.map((item: any, index: number) => <article key={`${item.condition}-${index}`}><span><HeartPulse /></span><div><b>{item.condition}</b><p>{item.medication || (ar ? "لا يوجد علاج مسجل" : "No treatment recorded")}</p><small>{item.status}</small></div><time>{item.diagnosedDate ? new Date(item.diagnosedDate).toLocaleDateString(ar ? "ar-EG" : "en-US") : "-"}</time></article>) : <div className="record-empty">{ar ? "لا يوجد تاريخ مرضي مسجل" : "No medical history recorded"}</div>}</div></section>
        <aside><section className="record-allergies"><header><AlertCircle /><div><h3>{ar ? "الحساسيات" : "Allergies"}</h3><p>{ar ? "تنبيه قبل وصف العلاج" : "Review before prescribing"}</p></div></header><div>{selectedPatient.allergies.length ? selectedPatient.allergies.map((allergy) => <span key={allergy}>{allergy}</span>) : <p>{ar ? "لا توجد حساسيات مسجلة" : "No allergies recorded"}</p>}</div></section><section className="record-health"><header><Activity /><div><h3>{ar ? "آخر المؤشرات" : "Latest metrics"}</h3><p>{ar ? "أحدث القياسات الصحية" : "Recent health measurements"}</p></div></header><div>{selectedPatient.healthMetrics.length ? selectedPatient.healthMetrics.map((metric: any) => <div key={metric.label}><small>{metric.label}</small><b>{metric.value}</b></div>) : <p>{ar ? "لا توجد مؤشرات مسجلة" : "No metrics recorded"}</p>}</div></section></aside>
      </div>
    </div></TaskModal>}
  </div>;
}
