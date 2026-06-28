import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertCircle, CalendarDays, CheckCircle2, Droplets, Edit3, HeartPulse,
  Mail, MapPin, Phone, Plus, Ruler, Save, ShieldCheck, Trash2, UserRound, Weight, X,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useApp } from "../contexts/AppContext";
import { api } from "../services/api";
import { useAsyncData } from "../hooks/useAsyncData";

interface Props { onNavigate?: (state: string) => void; onBack?: () => void; onProfileUpdated?: (user: any) => void }
type Tab = "overview" | "history" | "emergency";
interface ProfileDraft {
  name: string; phone: string; email: string; birthDate: string; gender: string; address: string;
  bloodType: string; height: string; weight: string; emergencyContact: string; emergencyContactName: string;
}
interface EmergencyContact { _id?: string; name: string; phone: string; relation: string }
interface MedicalEntry { condition: string; diagnosedDate: string; status: string; medication: string }

const emptyProfile: ProfileDraft = { name: "-", phone: "-", email: "-", birthDate: "", gender: "male", address: "", bloodType: "-", height: "", weight: "", emergencyContact: "", emergencyContactName: "" };

export function PatientProfile({ onProfileUpdated }: Props) {
  const { dir, language } = useApp();
  const ar = language === "ar";
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { data, setData, isLoading, error } = useAsyncData(() => api.patientProfile(), []);
  const [profile, setProfile] = useState<ProfileDraft>(emptyProfile);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [medicalHistory, setMedicalHistory] = useState<MedicalEntry[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState("");

  function mapProfile(source: any): ProfileDraft {
    return {
      name: source?.user?.name || "-", phone: source?.user?.phone || "-", email: source?.user?.email || "-",
      birthDate: source?.birthDate ? String(source.birthDate).slice(0, 10) : "", gender: source?.gender || "male",
      address: source?.address || "", bloodType: source?.bloodType || "-",
      height: source?.height ? String(source.height) : "", weight: source?.weight ? String(source.weight) : "",
      emergencyContact: source?.emergencyContact || "", emergencyContactName: source?.emergencyContactName || "",
    };
  }

  function loadEditableData(source: any) {
    setProfile(mapProfile(source));
    setMedicalHistory((Array.isArray(source?.medicalHistory) ? source.medicalHistory : []).map((item: any) => ({ condition: item.condition || "", diagnosedDate: item.diagnosedDate ? String(item.diagnosedDate).slice(0, 10) : "", status: item.status || "", medication: item.medication || "" })));
    setAllergies(Array.isArray(source?.allergies) ? source.allergies : []);
    const contacts = Array.isArray(source?.emergencyContacts) ? source.emergencyContacts : [];
    setEmergencyContacts(contacts.length ? contacts.map((item: any) => ({ _id: item._id, name: item.name || "", phone: item.phone || "", relation: item.relation || "" })) : source?.emergencyContact || source?.emergencyContactName ? [{ name: source.emergencyContactName || "", phone: source.emergencyContact || "", relation: "" }] : []);
  }

  useEffect(() => { if (data) loadEditableData(data); }, [data]);
  const age = profile.birthDate ? Math.max(0, new Date().getFullYear() - new Date(profile.birthDate).getFullYear()) : "-";
  const bmi = useMemo(() => { const height = Number(profile.height) / 100; const weight = Number(profile.weight); return height > 0 && weight > 0 ? (weight / (height * height)).toFixed(1) : "-"; }, [profile.height, profile.weight]);
  const initials = profile.name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2);

  function change(field: keyof ProfileDraft, value: string) { setProfile((current) => ({ ...current, [field]: value })); }
  function cancelEdit() { if (data) loadEditableData(data); setEditing(false); }
  async function saveProfile() {
    setSaving(true);
    try {
      const updated = await api.updatePatientProfile({
        ...(profile.name.trim() && profile.name !== "-" ? { name: profile.name.trim() } : {}),
        ...(profile.phone.trim() && profile.phone !== "-" ? { phone: profile.phone.trim() } : {}),
        ...(profile.email.trim() && profile.email !== "-" ? { email: profile.email.trim() } : {}),
        birthDate: profile.birthDate || undefined, gender: profile.gender, address: profile.address,
        bloodType: profile.bloodType, height: Number(profile.height) || undefined, weight: Number(profile.weight) || undefined,
        emergencyContact: emergencyContacts[0]?.phone || "", emergencyContactName: emergencyContacts[0]?.name || "",
        emergencyContacts: emergencyContacts.filter((contact) => contact.name.trim() && contact.phone.trim()).map(({ name, phone, relation }) => ({ name: name.trim(), phone: phone.trim(), relation: relation.trim() })),
        medicalHistory: medicalHistory.filter((item) => item.condition.trim()).map((item) => ({ ...item, diagnosedDate: item.diagnosedDate || undefined })),
        allergies,
      });
      setData(updated); loadEditableData(updated); onProfileUpdated?.(updated.user); setEditing(false);
      toast.success(ar ? "تم تحديث ملفك الصحي" : "Health profile updated");
    } catch (saveError) { toast.error(saveError instanceof Error ? saveError.message : (ar ? "تعذر حفظ البيانات" : "Unable to save changes")); }
    finally { setSaving(false); }
  }

  if (isLoading) return <div className="health-profile-loading"><div className="loading-spinner" /><p>{ar ? "جاري تحميل ملفك الصحي..." : "Loading your health profile..."}</p></div>;
  if (error) return <div className="health-profile-loading error"><AlertCircle /><h3>{ar ? "تعذر تحميل الملف الصحي" : "Unable to load health profile"}</h3><p>{error}</p></div>;

  return <div className="health-profile-v2" dir={dir}>
    <header className="health-profile-head"><div><span>{ar ? "سجلك الصحي" : "Your health record"}</span><h2>{ar ? "ملفي الصحي" : "My health profile"}</h2><p>{ar ? "بياناتك الأساسية وتاريخك الطبي وجهة اتصال الطوارئ في مكان واحد." : "Your essentials, medical history and emergency contact in one place."}</p></div>{!editing ? <button onClick={() => setEditing(true)}><Edit3 />{ar ? "تعديل البيانات" : "Edit profile"}</button> : <div><button className="cancel" onClick={cancelEdit}><X />{ar ? "إلغاء" : "Cancel"}</button><button onClick={saveProfile} disabled={saving}><Save />{saving ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ التغييرات" : "Save changes")}</button></div>}</header>

    <section className="health-identity-card">
      <div className="health-person"><span>{initials || <UserRound />}</span><div><small>{ar ? "ملف مريض موثّق" : "Verified patient profile"}</small><h3>{profile.name}</h3><p><Phone />{profile.phone}<i>•</i><Mail />{profile.email}</p></div></div>
      <div className="health-identity-meta"><div><span><ShieldCheck /></span><p><small>{ar ? "حالة الملف" : "Profile status"}</small><b>{ar ? "مفعّل وآمن" : "Active & secure"}</b></p></div><div><span><CalendarDays /></span><p><small>{ar ? "العمر" : "Age"}</small><b>{age} {ar && age !== "-" ? "سنة" : ""}</b></p></div><div><span><Droplets /></span><p><small>{ar ? "فصيلة الدم" : "Blood type"}</small><b>{profile.bloodType}</b></p></div></div>
    </section>

    <section className="health-metrics"><div><span><Ruler /></span><p><small>{ar ? "الطول" : "Height"}</small><b>{profile.height || "-"} {profile.height ? (ar ? "سم" : "cm") : ""}</b></p></div><div><span><Weight /></span><p><small>{ar ? "الوزن" : "Weight"}</small><b>{profile.weight || "-"} {profile.weight ? (ar ? "كجم" : "kg") : ""}</b></p></div><div><span><Activity /></span><p><small>{ar ? "مؤشر كتلة الجسم" : "Body mass index"}</small><b>{bmi}</b></p></div><div><span><HeartPulse /></span><p><small>{ar ? "الحالات المسجلة" : "Recorded conditions"}</small><b>{medicalHistory.length}</b></p></div></section>

    <div className="health-profile-layout">
      <nav className="health-profile-tabs" aria-label={ar ? "أقسام الملف الصحي" : "Health profile sections"}><button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}><UserRound /><span><b>{ar ? "البيانات الأساسية" : "Personal details"}</b><small>{ar ? "الهوية والقياسات" : "Identity and metrics"}</small></span></button><button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}><HeartPulse /><span><b>{ar ? "التاريخ الطبي" : "Medical history"}</b><small>{medicalHistory.length} {ar ? "حالات مسجلة" : "conditions"}</small></span></button><button className={tab === "emergency" ? "active" : ""} onClick={() => setTab("emergency")}><AlertCircle /><span><b>{ar ? "الطوارئ" : "Emergency"}</b><small>{ar ? "جهة الاتصال" : "Emergency contact"}</small></span></button></nav>

      <main className="health-profile-panel">
        {tab === "overview" && <><header><UserRound /><div><h3>{ar ? "المعلومات الشخصية والصحية" : "Personal and health information"}</h3><p>{editing ? (ar ? "يمكنك تعديل الحقول المتاحة ثم حفظ التغييرات." : "Edit the available fields, then save your changes.") : (ar ? "راجع بياناتك الأساسية والقياسات المسجلة." : "Review your basic details and recorded measurements.")}</p></div></header><div className="health-fields">
          <HealthField icon={<UserRound />} label={ar ? "الاسم الكامل" : "Full name"} value={profile.name} editing={editing} onChange={(value) => change("name", value)} />
          <HealthField icon={<Phone />} label={ar ? "رقم الهاتف" : "Phone"} value={profile.phone} editing={editing} dir="ltr" onChange={(value) => change("phone", value)} />
          <HealthField icon={<Mail />} label={ar ? "البريد الإلكتروني" : "Email"} value={profile.email} editing={editing} type="email" dir="ltr" onChange={(value) => change("email", value)} />
          <HealthField icon={<CalendarDays />} label={ar ? "تاريخ الميلاد" : "Birth date"} value={profile.birthDate} editing={editing} type="date" onChange={(value) => change("birthDate", value)} />
          <HealthField label={ar ? "النوع" : "Gender"} value={profile.gender === "male" ? (ar ? "ذكر" : "Male") : (ar ? "أنثى" : "Female")} editing={editing} selectValue={profile.gender} options={[{ value: "male", label: ar ? "ذكر" : "Male" }, { value: "female", label: ar ? "أنثى" : "Female" }]} onChange={(value) => change("gender", value)} />
          <HealthField icon={<Droplets />} label={ar ? "فصيلة الدم" : "Blood type"} value={profile.bloodType} editing={editing} selectValue={profile.bloodType} options={["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((value) => ({ value, label: value }))} onChange={(value) => change("bloodType", value)} />
          <HealthField icon={<Ruler />} label={ar ? "الطول (سم)" : "Height (cm)"} value={profile.height} editing={editing} type="number" onChange={(value) => change("height", value)} />
          <HealthField icon={<Weight />} label={ar ? "الوزن (كجم)" : "Weight (kg)"} value={profile.weight} editing={editing} type="number" onChange={(value) => change("weight", value)} />
          <label className="health-field health-field-wide"><span><MapPin />{ar ? "العنوان" : "Address"}</span>{editing ? <textarea rows={3} value={profile.address} onChange={(event) => change("address", event.target.value)} /> : <b>{profile.address || "-"}</b>}</label>
        </div></>}

        {tab === "history" && <><header><HeartPulse /><div><h3>{ar ? "التاريخ الطبي" : "Medical history"}</h3><p>{editing ? (ar ? "أضف أو عدّل الحالات والحساسيات ثم احفظ التغييرات." : "Add or edit conditions and allergies, then save.") : (ar ? "الحالات السابقة والحالية والحساسيات المسجلة." : "Past and current conditions with recorded allergies.")}</p></div>{!editing && <button className="panel-edit-button" onClick={() => setEditing(true)}><Edit3 />{ar ? "تعديل" : "Edit"}</button>}</header><div className={`medical-history-v2 ${editing ? "editing" : ""}`}><section><h4>{ar ? "الحالات الطبية" : "Medical conditions"}{editing && <button onClick={() => setMedicalHistory((items) => [...items, { condition: "", diagnosedDate: "", status: "", medication: "" }])}><Plus />{ar ? "إضافة حالة" : "Add condition"}</button>}</h4><div>{medicalHistory.length ? medicalHistory.map((condition, index) => editing ? <article className="medical-entry-form" key={index}><div><label><span>{ar ? "اسم الحالة" : "Condition"}</span><input value={condition.condition} onChange={(event) => setMedicalHistory((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, condition: event.target.value } : item))} /></label><label><span>{ar ? "العلاج" : "Medication"}</span><input value={condition.medication} onChange={(event) => setMedicalHistory((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, medication: event.target.value } : item))} /></label><label><span>{ar ? "تاريخ التشخيص" : "Diagnosed date"}</span><input type="date" value={condition.diagnosedDate} onChange={(event) => setMedicalHistory((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, diagnosedDate: event.target.value } : item))} /></label><label><span>{ar ? "الحالة" : "Status"}</span><input value={condition.status} onChange={(event) => setMedicalHistory((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, status: event.target.value } : item))} /></label></div><button onClick={() => setMedicalHistory((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></button></article> : <article key={`${condition.condition}-${index}`}><span><HeartPulse /></span><div><h3>{condition.condition}</h3><p>{condition.medication || (ar ? "لا يوجد علاج مسجل" : "No medication recorded")}</p><small><CalendarDays />{condition.diagnosedDate ? new Date(condition.diagnosedDate).toLocaleDateString(ar ? "ar-EG" : "en-US") : "-"}</small></div><i>{condition.status}</i></article>) : <HealthEmpty icon={<HeartPulse />} title={ar ? "لا توجد حالات مسجلة" : "No conditions recorded"} text={ar ? "يمكنك إضافة أول حالة عند تفعيل وضع التعديل." : "Enable editing to add your first condition."} />}</div></section><aside><h4><AlertCircle />{ar ? "الحساسيات" : "Allergies"}</h4><div>{allergies.map((allergy, index) => <span key={`${allergy}-${index}`}>{allergy}{editing && <button onClick={() => setAllergies((items) => items.filter((_, itemIndex) => itemIndex !== index))}><X /></button>}</span>)}{!allergies.length && !editing && <p><CheckCircle2 />{ar ? "لا توجد حساسيات مسجلة" : "No allergies recorded"}</p>}{editing && <div className="allergy-adder"><input value={newAllergy} onChange={(event) => setNewAllergy(event.target.value)} placeholder={ar ? "اكتب اسم الحساسية" : "Allergy name"} /><button onClick={() => { const value = newAllergy.trim(); if (value && !allergies.includes(value)) setAllergies((items) => [...items, value]); setNewAllergy(""); }}><Plus /></button></div>}</div></aside></div></>}

        {tab === "emergency" && <><header><AlertCircle /><div><h3>{ar ? "جهات اتصال الطوارئ" : "Emergency contacts"}</h3><p>{ar ? "أضف أكثر من شخص يمكن التواصل معه عند الحاجة الطبية العاجلة." : "Add multiple people who can be contacted during an emergency."}</p></div>{!editing && <button className="panel-edit-button" onClick={() => setEditing(true)}><Edit3 />{ar ? "تعديل" : "Edit"}</button>}</header><div className="emergency-contacts-v2">{emergencyContacts.map((contact, index) => <article key={contact._id || index} className={editing ? "editing" : ""}><span><UserRound /></span>{editing ? <div className="emergency-contact-fields"><label><span>{ar ? "الاسم" : "Name"}</span><input value={contact.name} onChange={(event) => setEmergencyContacts((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} /></label><label><span>{ar ? "رقم الهاتف" : "Phone"}</span><input dir="ltr" value={contact.phone} onChange={(event) => setEmergencyContacts((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, phone: event.target.value } : item))} /></label><label><span>{ar ? "صلة القرابة" : "Relation"}</span><input value={contact.relation} onChange={(event) => setEmergencyContacts((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, relation: event.target.value } : item))} /></label></div> : <div><small>{index === 0 ? (ar ? "جهة الاتصال الأساسية" : "Primary contact") : contact.relation || (ar ? "جهة اتصال إضافية" : "Additional contact")}</small><h3>{contact.name}</h3><p>{contact.phone}</p></div>}<div className="emergency-contact-actions">{!editing && contact.phone && <a href={`tel:${contact.phone}`}><Phone />{ar ? "اتصال" : "Call"}</a>}{editing && <button onClick={() => setEmergencyContacts((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></button>}</div></article>)}{!emergencyContacts.length && !editing && <HealthEmpty icon={<Phone />} title={ar ? "لا توجد جهات اتصال" : "No emergency contacts"} text={ar ? "اضغط تعديل لإضافة أول جهة اتصال." : "Select edit to add your first contact."} />}{editing && <button className="add-emergency-contact" onClick={() => setEmergencyContacts((items) => [...items, { name: "", phone: "", relation: "" }])}><Plus />{ar ? "إضافة جهة اتصال أخرى" : "Add another contact"}</button>}</div></>}
      </main>
    </div>
  </div>;
}

function HealthField({ icon, label, value, editing, onChange, type = "text", dir, options, selectValue }: { icon?: ReactNode; label: string; value: string; editing?: boolean; onChange?: (value: string) => void; type?: string; dir?: string; options?: Array<{ value: string; label: string }>; selectValue?: string }) {
  return <label className="health-field"><span>{icon}{label}</span>{editing && onChange ? options ? <select value={selectValue} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={type} value={value} dir={dir} onChange={(event) => onChange(event.target.value)} /> : <b dir={dir}>{value || "-"}</b>}</label>;
}

function HealthEmpty({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="health-empty"><span>{icon}</span><h3>{title}</h3><p>{text}</p></div>;
}
