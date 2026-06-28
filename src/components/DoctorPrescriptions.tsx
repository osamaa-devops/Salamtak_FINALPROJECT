import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, FileText, Pill, Plus, Search, Stethoscope, UserRound } from "lucide-react";
import { api } from "../services/api";
import { useAsyncData } from "../hooks/useAsyncData";
import { useApp } from "../contexts/AppContext";
import { TaskModal } from "./TaskModal";

export function DoctorPrescriptions({ onNavigate }: { onNavigate?: (state: string) => void }) {
  const { language, dir } = useApp(); const ar = language === "ar"; const Arrow = ar ? ChevronLeft : ChevronRight;
  const [search, setSearch] = useState(""); const [selected, setSelected] = useState<any>(null);
  const { data, isLoading, error } = useAsyncData(() => api.prescriptions(), []);
  const items = useMemo(() => (data || []).filter((item: any) => `${item.patient?.name} ${item.diagnosis}`.toLowerCase().includes(search.toLowerCase())), [data, search]);
  const thisMonth = (data || []).filter((item: any) => { const date = new Date(item.createdAt); const now = new Date(); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); }).length;

  return <div className="prescriptions-page workspace-page" dir={dir}>
    <header className="workspace-page-head"><div><span>{ar ? "السجل الطبي" : "Medical records"}</span><h2>{ar ? "الروشتات" : "Prescriptions"}</h2><p>{ar ? "راجع الروشتات السابقة واكتب خطة علاج جديدة." : "Review previous prescriptions and create a new care plan."}</p></div><button onClick={() => onNavigate?.("prescription")}><Plus />{ar ? "روشتة جديدة" : "New prescription"}</button></header>
    <section className="workspace-summary"><div><span><FileText /></span><p><b>{(data || []).length}</b><small>{ar ? "إجمالي الروشتات" : "Total prescriptions"}</small></p></div><div><span><CalendarDays /></span><p><b>{thisMonth}</b><small>{ar ? "هذا الشهر" : "This month"}</small></p></div><div><span><UserRound /></span><p><b>{new Set((data || []).map((item: any) => item.patient?._id)).size}</b><small>{ar ? "مرضى تمت متابعتهم" : "Treated patients"}</small></p></div></section>
    <section className="workspace-board"><div className="workspace-toolbar"><div><Search /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={ar ? "ابحث باسم المريض أو التشخيص..." : "Search patient or diagnosis..."} /></div><span>{items.length} {ar ? "روشتة" : "prescriptions"}</span></div><div className="prescription-list">
      {isLoading && <div className="workspace-empty"><div className="loading-spinner" /></div>}{error && <div className="workspace-empty">{error}</div>}
      {!isLoading && !error && items.map((item: any) => <button className="prescription-row" key={item._id} onClick={() => setSelected(item)}><span className="prescription-row-icon"><FileText /></span><div className="prescription-patient"><b>{item.patient?.name}</b><small>{item.patient?.phone || (ar ? "مريض سلامتك" : "Salamtak patient")}</small></div><div className="prescription-diagnosis"><span>{ar ? "التشخيص" : "Diagnosis"}</span><b>{item.diagnosis}</b></div><div className="prescription-meds"><span>{ar ? "الأدوية" : "Medication"}</span><b><Pill />{item.medications?.length || 0}</b></div><time>{new Date(item.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-US")}</time><Arrow /></button>)}
      {!isLoading && !error && items.length === 0 && <div className="workspace-empty"><span><FileText /></span><h3>{ar ? "لا توجد روشتات" : "No prescriptions yet"}</h3><button onClick={() => onNavigate?.("prescription")}><Plus />{ar ? "كتابة أول روشتة" : "Create first prescription"}</button></div>}
    </div></section>
    {selected && <TaskModal title={ar ? "تفاصيل الروشتة" : "Prescription details"} description={`${selected.patient?.name} · ${new Date(selected.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-US")}`} onClose={() => setSelected(null)}><div className="prescription-preview"><header><span><Stethoscope /></span><div><small>Salamtak Medical Record</small><h2>{ar ? "روشتة طبية" : "Medical prescription"}</h2></div></header><section><div><span>{ar ? "المريض" : "Patient"}</span><b>{selected.patient?.name}</b></div><div><span>{ar ? "التشخيص" : "Diagnosis"}</span><b>{selected.diagnosis}</b></div></section><h3>{ar ? "خطة العلاج" : "Treatment plan"}</h3><div className="preview-medications">{selected.medications?.map((med: any, index: number) => <article key={`${med.name}-${index}`}><b>{index + 1}</b><div><h4>{med.name}</h4><p>{med.dosage} · {med.frequency} · {med.duration}</p><small>{med.instructions}</small></div></article>)}</div>{selected.notes && <footer><span>{ar ? "ملاحظات الطبيب" : "Doctor notes"}</span><p>{selected.notes}</p></footer>}</div></TaskModal>}
  </div>;
}
