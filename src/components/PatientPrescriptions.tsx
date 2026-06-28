import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, FileText, Pill, Search, Stethoscope, UserRound } from "lucide-react";
import { api } from "../services/api";
import { useAsyncData } from "../hooks/useAsyncData";
import { useApp } from "../contexts/AppContext";
import { TaskModal } from "./TaskModal";

export function PatientPrescriptions() {
  const { language, dir } = useApp();
  const ar = language === "ar";
  const Arrow = ar ? ChevronLeft : ChevronRight;
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const { data, isLoading, error } = useAsyncData(() => api.prescriptions(), []);
  const prescriptions = Array.isArray(data) ? data : [];
  const items = useMemo(() => prescriptions.filter((item: any) => `${item.doctor?.name || ""} ${item.diagnosis || ""} ${(item.medications || []).map((medication: any) => medication.name).join(" ")}`.toLowerCase().includes(search.toLowerCase())), [prescriptions, search]);
  const thisMonth = prescriptions.filter((item: any) => { const date = new Date(item.createdAt); const now = new Date(); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); }).length;
  const medicationCount = prescriptions.reduce((total: number, item: any) => total + (item.medications?.length || 0), 0);

  return <div className="patient-prescriptions-v2" dir={dir}>
    <header className="patient-rx-head"><div><span>{ar ? "خطتك العلاجية" : "Your treatment plan"}</span><h2>{ar ? "روشتاتي" : "My prescriptions"}</h2><p>{ar ? "كل روشتة يرسلها طبيبك ستظهر هنا مع الجرعات وتعليمات الاستخدام." : "Every prescription shared by your doctor appears here with doses and instructions."}</p></div><span className="rx-secure"><FileText />{ar ? "سجل طبي آمن" : "Secure medical record"}</span></header>

    <section className="patient-rx-summary"><div><span><FileText /></span><p><b>{prescriptions.length}</b><small>{ar ? "إجمالي الروشتات" : "Total prescriptions"}</small></p></div><div><span><CalendarDays /></span><p><b>{thisMonth}</b><small>{ar ? "وصلت هذا الشهر" : "Received this month"}</small></p></div><div><span><Pill /></span><p><b>{medicationCount}</b><small>{ar ? "أدوية موصوفة" : "Prescribed medications"}</small></p></div></section>

    <section className="patient-rx-board"><header><div className="patient-rx-search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={ar ? "ابحث باسم الطبيب أو التشخيص أو الدواء..." : "Search doctor, diagnosis or medication..."} />{search && <button onClick={() => setSearch("")}>{ar ? "مسح" : "Clear"}</button>}</div><span>{items.length} {ar ? "روشتة" : "prescriptions"}</span></header><div className="patient-rx-list">
      {isLoading && <div className="patient-rx-empty"><div className="loading-spinner" /><p>{ar ? "جاري تحميل الروشتات..." : "Loading prescriptions..."}</p></div>}
      {error && <div className="patient-rx-empty error"><p>{error}</p></div>}
      {!isLoading && !error && items.map((item: any) => <article key={item._id} onClick={() => setSelected(item)}>
        <div className="rx-date"><b>{new Date(item.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-US", { day: "2-digit" })}</b><span>{new Date(item.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-US", { month: "short" })}</span><small>{new Date(item.createdAt).getFullYear()}</small></div>
        <div className="rx-doctor"><span>{item.doctor?.name?.slice(0,1) || <UserRound />}</span><p><small>{ar ? "كتبها الطبيب" : "Prescribed by"}</small><b>{item.doctor?.name || (ar ? "طبيب سلامتك" : "Salamtak doctor")}</b></p></div>
        <div className="rx-diagnosis"><span>{ar ? "التشخيص" : "Diagnosis"}</span><b>{item.diagnosis}</b></div>
        <div className="rx-medications"><span>{ar ? "خطة العلاج" : "Treatment plan"}</span><p><Pill />{item.medications?.length || 0} {ar ? "أدوية" : "medications"}</p></div>
        <button><FileText />{ar ? "عرض الروشتة" : "View prescription"}<Arrow /></button>
      </article>)}
      {!isLoading && !error && !items.length && <div className="patient-rx-empty"><span><FileText /></span><h3>{ar ? "لا توجد روشتات بعد" : "No prescriptions yet"}</h3><p>{ar ? "عندما يرسل لك الطبيب روشتة ستظهر هنا مباشرة." : "A prescription will appear here when your doctor shares it."}</p></div>}
    </div></section>

    {selected && <TaskModal title={ar ? "الروشتة الطبية" : "Medical prescription"} description={`${selected.doctor?.name || ""} · ${new Date(selected.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-US")}`} size="wide" onClose={() => setSelected(null)}><div className="patient-rx-preview"><header><div><span><Stethoscope /></span><p><small>SALAMTAK MEDICAL RECORD</small><h2>{ar ? "روشتة طبية" : "Medical prescription"}</h2></p></div><i><FileText /></i></header><section className="rx-preview-info"><div><span>{ar ? "الطبيب" : "Doctor"}</span><b>{selected.doctor?.name || "-"}</b></div><div><span>{ar ? "التشخيص" : "Diagnosis"}</span><b>{selected.diagnosis}</b></div><div><span>{ar ? "التاريخ" : "Date"}</span><b>{new Date(selected.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-US")}</b></div></section><section className="rx-treatment"><h3>{ar ? "الأدوية وتعليمات الاستخدام" : "Medication and directions"}</h3><div>{selected.medications?.map((medication: any, index: number) => <article key={`${medication.name}-${index}`}><b>{index + 1}</b><div><h4>{medication.name}</h4><p><span>{ar ? "الجرعة" : "Dose"}: {medication.dosage}</span>{medication.frequency && <span>{ar ? "التكرار" : "Frequency"}: {medication.frequency}</span>}{medication.duration && <span>{ar ? "المدة" : "Duration"}: {medication.duration}</span>}</p>{medication.instructions && <small>{medication.instructions}</small>}</div></article>)}</div></section>{selected.notes && <footer><span>{ar ? "ملاحظات الطبيب" : "Doctor notes"}</span><p>{selected.notes}</p></footer>}</div></TaskModal>}
  </div>;
}
