import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../config/db.js";
import { validateEnv } from "../config/env.js";
import { User } from "../models/User.js";
import { DoctorProfile } from "../models/DoctorProfile.js";
import { PatientProfile } from "../models/PatientProfile.js";
import { Appointment } from "../models/Appointment.js";
import { Prescription } from "../models/Prescription.js";
import { MedicationSchedule } from "../models/MedicationSchedule.js";
import { Reminder } from "../models/Reminder.js";
import { Pharmacy } from "../models/Pharmacy.js";
import { Review } from "../models/Review.js";
import { Consultation } from "../models/Consultation.js";
import { Order } from "../models/Order.js";
import { logger } from "../utils/logger.js";

const passwordHash = await bcrypt.hash("Password123!", 12);

async function resetCollections() {
  await Promise.all([
    User.deleteMany({}),
    DoctorProfile.deleteMany({}),
    PatientProfile.deleteMany({}),
    Appointment.deleteMany({}),
    Prescription.deleteMany({}),
    MedicationSchedule.deleteMany({}),
    Reminder.deleteMany({}),
    Pharmacy.deleteMany({}),
    Review.deleteMany({}),
    Consultation.deleteMany({}),
    Order.deleteMany({}),
  ]);
}

async function runSeed() {
  validateEnv();
  await connectDB();
  await resetCollections();

  const [patient, patient2, patient3, patient4, patient5, doctor, doctor2, doctor3] = await User.create([
    { name: "اسامه رضا رافت", email: "patient@salamtak.com", phone: "01234567890", passwordHash, role: "patient" },
    { name: "فاطمة أحمد محمد", email: "fatima@salamtak.com", phone: "01234567891", passwordHash, role: "patient" },
    { name: "محمد علي حسن", email: "mohamed@salamtak.com", phone: "01234567892", passwordHash, role: "patient" },
    { name: "سارة محمود عبدالله", email: "sara@salamtak.com", phone: "01234567893", passwordHash, role: "patient" },
    { name: "عمر حسن إبراهيم", email: "omar@salamtak.com", phone: "01234567894", passwordHash, role: "patient" },
    { name: "د. مختار نبيل", email: "doctor@salamtak.com", phone: "01111111111", passwordHash, role: "doctor" },
    { name: "د. مؤمن اسماعيل", email: "moamen@salamtak.com", phone: "01111111112", passwordHash, role: "doctor" },
    { name: "د. محمد علاء", email: "alaa@salamtak.com", phone: "01111111113", passwordHash, role: "doctor" },
  ]);

  await DoctorProfile.create([
    {
      user: doctor._id,
      specialty: "أمراض القلب",
      experience: 15,
      clinic: "مستشفى النور",
      address: "شارع النيل، المعادي، القاهرة",
      workHours: "من 9 ص إلى 5 م",
      fee: 200,
      rating: 4.8,
      availableSlots: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      consultationType: "both",
      isAvailableForVideo: true,
    },
    {
      user: doctor2._id,
      specialty: "الجلدية",
      experience: 12,
      clinic: "عيادة الجمال",
      address: "شارع التحرير، وسط البلد، القاهرة",
      workHours: "من 10 ص إلى 6 م",
      fee: 150,
      rating: 4.9,
      availableSlots: ["10:00", "11:00", "16:00", "17:00"],
      consultationType: "clinic",
      nextAvailable: "16:00",
    },
    {
      user: doctor3._id,
      specialty: "الطب العام",
      experience: 10,
      clinic: "استشارة عن بعد",
      address: "متاح أونلاين",
      workHours: "24/7",
      fee: 100,
      rating: 4.7,
      availableSlots: ["08:00", "09:00", "20:00", "21:00"],
      consultationType: "video",
      isAvailableForVideo: true,
    },
  ]);

  await PatientProfile.create([
    {
      user: patient._id,
      birthDate: new Date("1990-01-15"),
      gender: "male",
      address: "مدينة العاشر من رمضان، الشرقية",
      bloodType: "O+",
      height: 175,
      weight: 75,
      emergencyContact: "01987654321",
      emergencyContactName: "رضا رافت",
      condition: "ارتفاع ضغط الدم",
      status: "stable",
      visits: 12,
      lastVisit: new Date("2024-01-10"),
      nextAppointment: new Date("2024-01-25"),
      medicalHistory: [
        { condition: "ارتفاع ضغط الدم", diagnosedDate: new Date("2022-03-15"), status: "مزمن", medication: "ليزينوبريل 10 مجم" },
        { condition: "مرض السكري النوع الثاني", diagnosedDate: new Date("2021-11-20"), status: "مزمن", medication: "ميتفورمين 500 مجم" },
      ],
      allergies: ["البنسلين", "الأسبرين", "المكسرات"],
      healthMetrics: [
        { label: "ضغط الدم", value: "120/80", status: "normal", color: "text-green-600" },
        { label: "مستوى السكر", value: "95 mg/dl", status: "normal", color: "text-green-600" },
        { label: "الوزن", value: "75 كجم", status: "stable", color: "text-blue-600" },
        { label: "درجة الحرارة", value: "37°C", status: "normal", color: "text-green-600" },
      ],
    },
    { user: patient2._id, birthDate: new Date("1996-04-02"), gender: "female", condition: "السكري النوع الثاني", status: "monitoring", visits: 8, lastVisit: new Date("2024-01-12"), nextAppointment: new Date("2024-01-22") },
    { user: patient3._id, birthDate: new Date("1979-08-20"), gender: "male", condition: "أمراض القلب", status: "critical", visits: 15, lastVisit: new Date("2024-01-13"), nextAppointment: new Date("2024-01-18") },
    { user: patient4._id, birthDate: new Date("1992-05-11"), gender: "female", condition: "فحص دوري", status: "healthy", visits: 5, lastVisit: new Date("2024-01-14"), nextAppointment: new Date("2024-02-14") },
    { user: patient5._id, birthDate: new Date("1972-06-09"), gender: "male", condition: "آلام المفاصل", status: "stable", visits: 20, lastVisit: new Date("2024-01-14"), nextAppointment: new Date("2024-01-28") },
  ]);

  await Appointment.create([
    { patient: patient._id, doctor: doctor._id, date: new Date(), time: "09:00", type: "consultation", status: "confirmed", clinic: "مستشفى النور", fee: 200 },
    { patient: patient2._id, doctor: doctor._id, date: new Date(), time: "10:30", type: "followup", status: "waiting", clinic: "مستشفى النور", fee: 200 },
    { patient: patient3._id, doctor: doctor._id, date: new Date(), time: "11:15", type: "video", status: "confirmed", clinic: "استشارة عن بعد", fee: 150 },
    { patient: patient4._id, doctor: doctor._id, date: new Date("2026-06-28"), time: "14:00", type: "consultation", status: "pending", clinic: "مستشفى النور", fee: 200 },
    { patient: patient._id, doctor: doctor3._id, date: new Date("2026-06-29"), time: "10:00", type: "followup", status: "confirmed", clinic: "استشارة عن بعد", fee: 100 },
  ]);

  await MedicationSchedule.create([
    { patient: patient._id, medicationName: "أسبرين 100 مجم", dosage: "قرص واحد", times: ["08:00", "20:00"], isActive: true, nextDose: new Date("2026-06-25T20:00:00"), takenToday: ["08:00"] },
    { patient: patient._id, medicationName: "ليزينوبريل 10 مجم", dosage: "قرص واحد", times: ["08:00"], isActive: true, nextDose: new Date("2026-06-26T08:00:00"), takenToday: [] },
  ]);

  await Reminder.create([
    { user: patient._id, type: "medication", title: "وقت تناول الدواء", message: "حان وقت تناول أسبرين 100 مجم", isRead: false },
    { user: patient._id, type: "appointment", title: "موعد طبي غداً", message: "لديك موعد مع د. مختار نبيل غداً في 2:00 م", time: new Date(Date.now() - 2 * 60 * 60 * 1000), isRead: false },
  ]);

  await Pharmacy.create([
    {
      name: "صيدلية الهدي",
      rating: 4.8,
      deliveryTime: "30-45 دقيقة",
      deliveryFee: 15,
      minOrder: 50,
      address: "مدينة العاشر من رمضان، الشرقية",
      phone: "01234567890",
      medications: [
        { name: "أسبرين 100 مجم", dosage: "30 قرص", price: 25, inStock: true, prescriptionRequired: false },
        { name: "باراسيتامول 500 مجم", dosage: "20 قرص", price: 18, inStock: true, prescriptionRequired: false },
        { name: "أموكسيسيلين 500 مجم", dosage: "14 كبسولة", price: 45, inStock: true, prescriptionRequired: true },
        { name: "فيتامين د 1000 وحدة", dosage: "30 كبسولة", price: 35, inStock: true, prescriptionRequired: false },
      ],
    },
    {
      name: "صيدلية الدواء",
      rating: 4.6,
      deliveryTime: "45-60 دقيقة",
      deliveryFee: 10,
      minOrder: 40,
      address: "مدينة نصر، القاهرة",
      phone: "01234567891",
      medications: [
        { name: "إيبوبروفين 400 مجم", dosage: "20 قرص", price: 22, inStock: true, prescriptionRequired: false },
        { name: "أوميبرازول 20 مجم", dosage: "14 كبسولة", price: 35, inStock: false, prescriptionRequired: true },
        { name: "لوراتادين 10 مجم", dosage: "10 أقراص", price: 28, inStock: true, prescriptionRequired: false },
      ],
    },
    {
      name: "صيدلية العزبي",
      rating: 4.7,
      deliveryTime: "25-40 دقيقة",
      deliveryFee: 12,
      minOrder: 45,
      address: "الإسكندرية، الإسكندرية",
      phone: "01234567892",
      medications: [
        { name: "أقراص الكالسيوم 600 مجم", dosage: "30 قرص", price: 38, inStock: true, prescriptionRequired: false },
        { name: "مسكن الألم القوي", dosage: "10 أقراص", price: 55, inStock: true, prescriptionRequired: true },
        { name: "فيتامين سي 1000 مجم", dosage: "30 قرص فوار", price: 48, inStock: true, prescriptionRequired: false },
      ],
    },
  ]);

  await Review.create([
    { patient: patient._id, patientName: "أحمد محمد", rating: 5, comment: "طبيب ممتاز ومتفهم. شرح لي حالتي بوضوح وكان العلاج فعال جداً. أنصح به بشدة.", category: "doctor", targetId: doctor._id, targetName: "د. مختار نبيل", helpful: 12, categories: { quality: 5, waiting: 4, staff: 5, cleanliness: 5, value: 5 } },
    { patient: patient2._id, patientName: "فاطمة علي", rating: 4, comment: "عيادة نظيفة وموظفين محترمين. وقت الانتظار كان قليل والطبيب كان جيد.", category: "clinic", targetName: "مستشفى النور", helpful: 8, categories: { quality: 4, waiting: 4, staff: 4, cleanliness: 5, value: 4 } },
    { patient: patient3._id, patientName: "محمد حسن", rating: 5, comment: "تحاليل دقيقة ونتائج سريعة. الأسعار معقولة والخدمة ممتازة.", category: "lab", targetName: "معمل الفا للتحاليل", helpful: 15, categories: { quality: 5, waiting: 5, staff: 5, cleanliness: 5, value: 4 } },
  ]);

  await Prescription.create({
    patient: patient._id,
    doctor: doctor._id,
    diagnosis: "ارتفاع ضغط الدم",
    medications: [{ name: "ليزينوبريل 10 مجم", dosage: "قرص واحد", frequency: "مرة واحدة يومياً", duration: "شهر واحد", instructions: "بعد الإفطار" }],
    notes: "متابعة الضغط يومياً",
  });

  logger.info("Database seeded successfully");
  logger.info("Patient login: phone 01234567890 / Password123!");
  logger.info("Doctor login: doctor@salamtak.com / Password123!");
  await disconnectDB();
}

runSeed().catch(async (error) => {
  logger.error("Seed failed", error);
  await disconnectDB();
  process.exit(1);
});
