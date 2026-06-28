import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, FileText, Pill, Plus, Search, Stethoscope, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useApp } from "../contexts/AppContext";
import { api } from "../services/api";
import { useAsyncData } from "../hooks/useAsyncData";

interface Medication { id: number; name: string; dosage: string; frequency: string; duration: string; instructions: string }
interface Props { onNavigate?: (state: string) => void; onBack?: () => void }

export function PrescriptionForm({ onBack }: Props) {
  const { language, dir } = useApp(); const ar = language === "ar"; const Forward = ar ? ArrowLeft : ArrowRight; const Back = ar ? ArrowRight : ArrowLeft;
  const { data: patients, isLoading } = useAsyncData(() => api.patients(), []);
  const [step, setStep] = useState(1); const [search, setSearch] = useState(""); const [patientId, setPatientId] = useState(""); const [diagnosis, setDiagnosis] = useState(""); const [notes, setNotes] = useState(""); const [saving, setSaving] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([{ id: 1, name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  const selectedPatient = (patients || []).find((patient: any) => patient.user?._id === patientId);
  const filteredPatients = (patients || []).filter((patient: any) => `${patient.user?.name} ${patient.condition}`.toLowerCase().includes(search.toLowerCase()));
  const updateMedication = (id: number, field: keyof Medication, value: string) => setMedications(items => items.map(item => item.id === id ? { ...item, [field]: value } : item));
  const addMedication = () => setMedications(items => [...items, { id: Date.now(), name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  const removeMedication = (id: number) => setMedications(items => items.length === 1 ? items : items.filter(item => item.id !== id));
  const validMedications = medications.filter(item => item.name.trim() && item.dosage.trim());

  async function save() {
    const cleanDiagnosis = diagnosis.trim();
    if (!selectedPatient?.user?._id) return toast.error(ar ? "اختر المريض أولاً" : "Choose a patient first");
    if (cleanDiagnosis.length < 2) return toast.error(ar ? "اكتب تشخيصًا واضحًا من حرفين على الأقل" : "Diagnosis must be at least 2 characters");
    if (!validMedications.length) return toast.error(ar ? "أضف دواءً واحدًا على الأقل مع الجرعة" : "Add at least one medication and dosage");
    setSaving(true);
    try {
      await api.createPrescription({
        patient: String(selectedPatient.user._id),
        diagnosis: cleanDiagnosis,
        medications: validMedications.map(({ id: _id, ...item }) => Object.fromEntries(Object.entries(item).map(([key, value]) => [key, value.trim()]))),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      toast.success(ar ? "تم حفظ الروشتة وإرسالها للمريض" : "Prescription saved and shared with patient");
      window.setTimeout(() => onBack?.(), 600);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Error"); }
    finally { setSaving(false); }
  }

  return <div className="prescription-wizard" dir={dir}>
    <div className="prescription-steps"><div className={step >= 1 ? "active" : ""}><span>{step > 1 ? <Check /> : "1"}</span><b>{ar ? "المريض" : "Patient"}</b></div><i className={step > 1 ? "active" : ""}></i><div className={step >= 2 ? "active" : ""}><span>{step > 2 ? <Check /> : "2"}</span><b>{ar ? "العلاج" : "Treatment"}</b></div><i className={step > 2 ? "active" : ""}></i><div className={step >= 3 ? "active" : ""}><span>3</span><b>{ar ? "المعاينة" : "Preview"}</b></div></div>
    {step === 1 && <section className="prescription-step"><div className="wizard-title"><span><UserRound /></span><div><h3>{ar ? "اختر المريض أولًا" : "Choose a patient first"}</h3><p>{ar ? "مرضـاك المرتبطون بمواعيد أو استشارات معك." : "Patients linked to your appointments or consultations."}</p></div></div><div className="wizard-search"><Search /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={ar ? "ابحث باسم المريض أو الحالة..." : "Search patient or condition..."} /></div><div className="wizard-patient-grid">{isLoading ? <div className="workspace-empty"><div className="loading-spinner" /></div> : filteredPatients.map((patient: any) => <button key={patient.user?._id} className={patientId === patient.user?._id ? "selected" : ""} onClick={() => setPatientId(patient.user?._id)}><span>{patient.user?.name?.slice(0,1)}</span><div><b>{patient.user?.name}</b><small>{patient.condition || (ar ? "متابعة عامة" : "General follow-up")}</small><p>{patient.user?.phone}</p></div><i><Check /></i></button>)}</div></section>}
    {step === 2 && selectedPatient && <section className="prescription-step"><div className="selected-patient-banner"><span>{selectedPatient.user?.name?.slice(0,1)}</span><div><small>{ar ? "الروشتة للمريض" : "Prescription for"}</small><b>{selectedPatient.user?.name}</b><p>{selectedPatient.condition}</p></div><button onClick={() => setStep(1)}>{ar ? "تغيير" : "Change"}</button></div><label className="wizard-field"><span>{ar ? "التشخيص" : "Diagnosis"}</span><input value={diagnosis} onChange={event => setDiagnosis(event.target.value)} placeholder={ar ? "اكتب التشخيص الطبي..." : "Enter medical diagnosis..."} /></label><div className="medications-builder"><div className="medications-builder-head"><div><h3>{ar ? "الأدوية وخطة العلاج" : "Medication & treatment"}</h3><p>{ar ? "أضف دواءً واحدًا أو أكثر." : "Add one or more medications."}</p></div><button onClick={addMedication}><Plus />{ar ? "إضافة دواء" : "Add medication"}</button></div>{medications.map((medication, index) => <article key={medication.id}><header><span><Pill /></span><b>{ar ? `الدواء ${index + 1}` : `Medication ${index + 1}`}</b><button onClick={() => removeMedication(medication.id)}><Trash2 /></button></header><div className="medication-fields"><label><span>{ar ? "اسم الدواء" : "Medication"}</span><input value={medication.name} onChange={event => updateMedication(medication.id, "name", event.target.value)} /></label><label><span>{ar ? "الجرعة" : "Dosage"}</span><input value={medication.dosage} onChange={event => updateMedication(medication.id, "dosage", event.target.value)} /></label><label><span>{ar ? "التكرار" : "Frequency"}</span><input value={medication.frequency} onChange={event => updateMedication(medication.id, "frequency", event.target.value)} /></label><label><span>{ar ? "المدة" : "Duration"}</span><input value={medication.duration} onChange={event => updateMedication(medication.id, "duration", event.target.value)} /></label><label className="medication-wide"><span>{ar ? "تعليمات الاستخدام" : "Instructions"}</span><input value={medication.instructions} onChange={event => updateMedication(medication.id, "instructions", event.target.value)} /></label></div></article>)}</div><label className="wizard-field"><span>{ar ? "ملاحظات إضافية" : "Additional notes"}</span><textarea rows={3} value={notes} onChange={event => setNotes(event.target.value)} /></label></section>}
    {step === 3 && selectedPatient && <section className="prescription-step"><div className="final-prescription"><header><span><Stethoscope /></span><div><small>SALAMTAK MEDICAL RECORD</small><h2>{ar ? "روشتة طبية" : "Medical prescription"}</h2></div><FileText /></header><div className="final-prescription-info"><div><span>{ar ? "المريض" : "Patient"}</span><b>{selectedPatient.user?.name}</b></div><div><span>{ar ? "التشخيص" : "Diagnosis"}</span><b>{diagnosis}</b></div><div><span>{ar ? "التاريخ" : "Date"}</span><b>{new Date().toLocaleDateString(ar ? "ar-EG" : "en-US")}</b></div></div><h3>{ar ? "خطة العلاج" : "Treatment plan"}</h3><div className="final-medication-list">{validMedications.map((medication, index) => <article key={medication.id}><b>{index + 1}</b><div><h4>{medication.name}</h4><p>{medication.dosage} · {medication.frequency} · {medication.duration}</p><small>{medication.instructions}</small></div></article>)}</div>{notes && <footer><span>{ar ? "ملاحظات" : "Notes"}</span><p>{notes}</p></footer>}</div></section>}
    <footer className="wizard-footer"><button onClick={() => step === 1 ? onBack?.() : setStep(value => value - 1)}><Back />{step === 1 ? (ar ? "إلغاء" : "Cancel") : (ar ? "السابق" : "Back")}</button><div><small>{ar ? `الخطوة ${step} من 3` : `Step ${step} of 3`}</small>{step < 3 ? <button className="wizard-primary" disabled={(step === 1 && !selectedPatient) || (step === 2 && (diagnosis.trim().length < 2 || !validMedications.length))} onClick={() => setStep(value => value + 1)}>{ar ? "التالي" : "Continue"}<Forward /></button> : <button className="wizard-primary" disabled={saving} onClick={save}>{saving ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ وإرسال للمريض" : "Save & share")}<Check /></button>}</div></footer>
  </div>;
}
