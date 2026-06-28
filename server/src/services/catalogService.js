import { DoctorProfile } from "../models/DoctorProfile.js";
import { PatientProfile } from "../models/PatientProfile.js";
import { Appointment } from "../models/Appointment.js";
import { Prescription } from "../models/Prescription.js";
import { MedicationSchedule } from "../models/MedicationSchedule.js";
import { Reminder } from "../models/Reminder.js";
import { Pharmacy } from "../models/Pharmacy.js";
import { Order } from "../models/Order.js";
import { Review } from "../models/Review.js";
import { Consultation } from "../models/Consultation.js";
import { AppError } from "../utils/AppError.js";
import { User } from "../models/User.js";

const userSelect = "name email phone role avatarUrl";

export async function listDoctors(query = {}) {
  const filter = {};
  if (query.specialty) filter.specialty = query.specialty;
  return DoctorProfile.find(filter).populate("user", userSelect).sort({ rating: -1, experience: -1 });
}

export async function listPatients(user, query = {}) {
  const filter = {};
  if (user.role === "doctor") {
    const [appointmentPatients, consultationPatients] = await Promise.all([
      Appointment.distinct("patient", { doctor: user._id }),
      Consultation.distinct("patient", { doctor: user._id }),
    ]);
    const patientIds = [...new Set([...appointmentPatients, ...consultationPatients].map(String))];
    filter.user = { $in: patientIds };
  }
  if (query.status) filter.status = query.status;
  const patients = await PatientProfile.find(filter).populate("user", userSelect).sort({ updatedAt: -1 });

  if (!query.search) return patients;
  const search = query.search.toLowerCase();
  return patients.filter((patient) => {
    const name = patient.user?.name?.toLowerCase() || "";
    const condition = patient.condition?.toLowerCase() || "";
    return name.includes(search) || condition.includes(search);
  });
}

export async function getPatientProfile(userId) {
  const profile = await PatientProfile.findOne({ user: userId }).populate("user", userSelect);
  if (!profile) throw new AppError("Patient profile not found", 404);
  return profile;
}

export async function updatePatientProfile(userId, data) {
  const allowed = ["birthDate", "gender", "address", "bloodType", "height", "weight", "emergencyContact", "emergencyContactName", "emergencyContacts", "allergies", "medicalHistory", "healthMetrics"];
  const userFields = ["name", "phone", "email"];
  const safeData = Object.fromEntries(Object.entries(data).filter(([key]) => allowed.includes(key)));
  const userData = Object.fromEntries(Object.entries(data).filter(([key]) => userFields.includes(key)));
  if (Object.keys(userData).length) await User.findByIdAndUpdate(userId, userData, { runValidators: true });
  const profile = await PatientProfile.findOneAndUpdate({ user: userId }, safeData, {
    returnDocument: "after",
    runValidators: true,
  }).populate("user", userSelect);
  if (!profile) throw new AppError("Patient profile not found", 404);
  return profile;
}

export async function getDoctorProfile(userId) {
  const profile = await DoctorProfile.findOne({ user: userId }).populate("user", userSelect);
  if (!profile) throw new AppError("Doctor profile not found", 404);
  return profile;
}

export async function updateDoctorProfile(userId, data) {
  const profileFields = ["specialty", "experience", "clinic", "address", "workHours", "fee", "availableSlots", "consultationType", "isAvailableForVideo"];
  const userFields = ["name", "phone"];
  const profileData = Object.fromEntries(Object.entries(data).filter(([key]) => profileFields.includes(key)));
  const userData = Object.fromEntries(Object.entries(data).filter(([key]) => userFields.includes(key)));
  if (Object.keys(userData).length) await User.findByIdAndUpdate(userId, userData, { runValidators: true });
  const profile = await DoctorProfile.findOneAndUpdate({ user: userId }, profileData, { returnDocument: "after", runValidators: true }).populate("user", userSelect);
  if (!profile) throw new AppError("Doctor profile not found", 404);
  return profile;
}

export async function listAppointments(user, query = {}) {
  const filter = {};
  if (user.role === "patient") filter.patient = user._id;
  if (user.role === "doctor") filter.doctor = user._id;
  if (query.status) filter.status = query.status;
  const appointments = await Appointment.find(filter)
    .populate("patient", userSelect)
    .populate("doctor", userSelect)
    .sort({ date: 1, time: 1 });

  const doctorIds = appointments.map((appointment) => appointment.doctor?._id).filter(Boolean);
  const patientIds = appointments.map((appointment) => appointment.patient?._id).filter(Boolean);
  const [doctorProfiles, patientProfiles] = await Promise.all([
    DoctorProfile.find({ user: { $in: doctorIds } }),
    PatientProfile.find({ user: { $in: patientIds } }),
  ]);
  const doctorProfileMap = new Map(doctorProfiles.map((profile) => [String(profile.user), profile.toObject()]));
  const patientProfileMap = new Map(patientProfiles.map((profile) => [String(profile.user), profile.toObject()]));

  return appointments.map((appointment) => {
    const object = appointment.toObject();
    object.doctorProfile = doctorProfileMap.get(String(appointment.doctor?._id));
    object.patientProfile = patientProfileMap.get(String(appointment.patient?._id));
    return object;
  });
}

export async function createAppointment(user, data) {
  if (user.role !== "patient") throw new AppError("Only patients can book appointments", 403);
  const doctor = await DoctorProfile.findOne({ user: data.doctor });
  if (!doctor) throw new AppError("Doctor not found", 404);
  if (new Date(data.date) < new Date(new Date().setHours(0, 0, 0, 0))) {
    throw new AppError("Appointment date must be today or later", 400);
  }
  if (data.type === "video" && !["video", "both"].includes(doctor.consultationType)) {
    throw new AppError("This doctor does not offer video appointments", 400);
  }
  const conflict = await Appointment.exists({
    doctor: data.doctor,
    date: data.date,
    time: data.time,
    status: { $nin: ["cancelled"] },
  });
  if (conflict) throw new AppError("This appointment slot is no longer available", 409);
  const appointment = await Appointment.create({
    ...data,
    patient: user._id,
    clinic: data.type === "video" ? "Online" : doctor.clinic,
    fee: doctor.fee,
    status: "pending",
  });
  await Reminder.create({
    user: user._id,
    type: "appointment",
    title: "Appointment booked",
    message: `Your appointment is scheduled for ${new Date(data.date).toLocaleDateString()} at ${data.time}`,
    time: new Date(data.date),
  });
  return appointment;
}

export async function updateAppointment(id, data, user) {
  const existing = await Appointment.findById(id);
  if (!existing) throw new AppError("Appointment not found", 404);

  const isOwnerPatient = user.role === "patient" && String(existing.patient) === String(user._id);
  const isOwnerDoctor = user.role === "doctor" && String(existing.doctor) === String(user._id);
  const isAdmin = user.role === "admin";

  if (!isOwnerPatient && !isOwnerDoctor && !isAdmin) {
    throw new AppError("You are not allowed to update this appointment", 403);
  }

  const safeData = {};
  if (isOwnerPatient) {
    if (["completed", "cancelled"].includes(existing.status)) throw new AppError("This appointment can no longer be changed", 400);
    ["date", "time", "type", "symptoms"].forEach((key) => { if (data[key] !== undefined) safeData[key] = data[key]; });
    if (data.status !== undefined) {
      if (data.status !== "cancelled") throw new AppError("Patients can only cancel an appointment", 403);
      safeData.status = "cancelled";
    }
  } else if (isOwnerDoctor || isAdmin) {
    ["status", "clinic", "time", "date"].forEach((key) => { if (data[key] !== undefined) safeData[key] = data[key]; });
  }

  if ((safeData.date || safeData.time) && safeData.status !== "cancelled") {
    const conflict = await Appointment.exists({
      _id: { $ne: id },
      doctor: existing.doctor,
      date: safeData.date || existing.date,
      time: safeData.time || existing.time,
      status: { $ne: "cancelled" },
    });
    if (conflict) throw new AppError("This appointment slot is no longer available", 409);
  }

  const appointment = await Appointment.findByIdAndUpdate(id, safeData, { returnDocument: "after", runValidators: true });
  if (!appointment) throw new AppError("Appointment not found", 404);
  return appointment;
}

export async function listPrescriptions(user) {
  const filter = user.role === "doctor" ? { doctor: user._id } : { patient: user._id };
  return Prescription.find(filter)
    .populate("patient", userSelect)
    .populate("doctor", userSelect)
    .sort({ createdAt: -1 });
}

export async function createPrescription(user, data) {
  if (user.role !== "doctor") throw new AppError("Only doctors can create prescriptions", 403);
  const relationships = await Promise.all([
    Appointment.exists({ doctor: user._id, patient: data.patient }),
    Consultation.exists({ doctor: user._id, patient: data.patient }),
  ]);
  const relationship = relationships.some(Boolean);
  if (!relationship) throw new AppError("You can only prescribe to your patients", 403);
  const prescription = await Prescription.create({ ...data, doctor: user._id });
  await Reminder.create({
    user: data.patient,
    type: "update",
    title: "New prescription",
    message: "Your doctor added a new prescription to your medical record",
  });
  return prescription;
}

export async function listMedicationSchedules(user) {
  const filter = { patient: user._id };
  return MedicationSchedule.find(filter).sort({ nextDose: 1 });
}

export async function createMedicationSchedule(user, data) {
  if (user.role !== "patient") throw new AppError("Only patients can manage medication schedules", 403);
  return MedicationSchedule.create({ ...data, patient: user._id });
}

export async function updateMedicationSchedule(id, data, user) {
  const schedule = await MedicationSchedule.findOneAndUpdate(
    { _id: id, patient: user._id },
    data,
    { returnDocument: "after", runValidators: true },
  );
  if (!schedule) throw new AppError("Medication schedule not found", 404);
  return schedule;
}

export async function deleteMedicationSchedule(id, user) {
  const schedule = await MedicationSchedule.findOneAndDelete({ _id: id, patient: user._id });
  if (!schedule) throw new AppError("Medication schedule not found", 404);
  return schedule;
}

export async function listReminders(user) {
  return Reminder.find({ user: user._id }).sort({ time: -1 });
}

export async function markReminderRead(id, user) {
  const reminder = await Reminder.findOneAndUpdate({ _id: id, user: user._id }, { isRead: true }, { returnDocument: "after" });
  if (!reminder) throw new AppError("Reminder not found", 404);
  return reminder;
}

export async function listPharmacies(query = {}) {
  const pharmacies = await Pharmacy.find().sort({ rating: -1 });
  if (!query.search) return pharmacies;
  const search = query.search.toLowerCase();
  return pharmacies
    .map((pharmacy) => {
      const object = pharmacy.toObject();
      object.medications = object.medications.filter((med) => med.name.toLowerCase().includes(search));
      return object;
    })
    .filter((pharmacy) => pharmacy.name.toLowerCase().includes(search) || pharmacy.medications.length > 0);
}

export async function createOrder(user, data) {
  if (user.role !== "patient") throw new AppError("Only patients can place pharmacy orders", 403);
  const pharmacy = await Pharmacy.findById(data.pharmacy);
  if (!pharmacy) throw new AppError("Pharmacy not found", 404);

  const items = [];
  for (const item of data.items) {
    const medication = pharmacy.medications.id(item.medication);
    if (!medication) throw new AppError(`Medication not found: ${item.medication}`, 404);
    if (!medication.inStock) throw new AppError(`${medication.name} is out of stock`, 400);
    if (medication.prescriptionRequired) {
      const hasPrescription = await Prescription.exists({ patient: user._id, "medications.name": medication.name });
      if (!hasPrescription) throw new AppError(`A valid prescription is required for ${medication.name}`, 403);
    }
    items.push({
      medication: medication._id,
      name: medication.name,
      dosage: medication.dosage,
      price: medication.price,
      quantity: item.quantity,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + pharmacy.deliveryFee;
  return Order.create({
    patient: user._id,
    pharmacy: pharmacy._id,
    items,
    deliveryAddress: data.deliveryAddress,
    paymentMethod: data.paymentMethod,
    subtotal,
    deliveryFee: pharmacy.deliveryFee,
    total,
  });
}

export async function listOrders(user) {
  const filter = user.role === "patient" ? { patient: user._id } : {};
  return Order.find(filter).populate("pharmacy", "name phone address").sort({ createdAt: -1 });
}

export async function cancelOrder(user, orderId) {
  const order = await Order.findOne({ _id: orderId, patient: user._id });
  if (!order) throw new AppError("Order not found", 404);
  if (!["pending", "confirmed"].includes(order.status)) throw new AppError("This order can no longer be cancelled", 400);
  order.status = "cancelled";
  await order.save();
  return order;
}

export async function listReviews(query = {}) {
  const filter = {};
  if (query.category) filter.category = query.category;
  if (query.rating) filter.rating = Number(query.rating);
  if (query.targetId) filter.targetId = query.targetId;
  return Review.find(filter).sort({ createdAt: -1 });
}

export async function createReview(user, data) {
  if (user.role !== "patient") throw new AppError("Only patients can add reviews", 403);
  return Review.create({ ...data, patient: user._id, patientName: user.name });
}

export async function markReviewHelpful(id, user) {
  const review = await Review.findById(id);
  if (!review) throw new AppError("Review not found", 404);
  if (review.helpfulUsers.some((userId) => String(userId) === String(user._id))) {
    throw new AppError("You already marked this review as helpful", 409);
  }
  review.helpfulUsers.push(user._id);
  review.helpful += 1;
  await review.save();
  return review;
}

export async function getReviewStats(category = "doctor", targetId) {
  const filter = { category };
  if (targetId) filter.targetId = targetId;
  const reviews = await Review.find(filter);
  const totalReviews = reviews.length;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const categoryTotals = { quality: 0, waiting: 0, staff: 0, cleanliness: 0, value: 0 };

  reviews.forEach((review) => {
    distribution[review.rating] += 1;
    Object.keys(categoryTotals).forEach((key) => {
      categoryTotals[key] += review.categories?.[key] || 0;
    });
  });

  const overall = totalReviews
    ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1))
    : 0;

  return {
    overall,
    totalReviews,
    distribution,
    categories: Object.fromEntries(
      Object.entries(categoryTotals).map(([key, value]) => [key, totalReviews ? Number((value / totalReviews).toFixed(1)) : 0]),
    ),
  };
}

export async function listVideoDoctors() {
  return DoctorProfile.find({ consultationType: { $in: ["video", "both"] } }).populate("user", userSelect).sort({ rating: -1 });
}

export async function startConsultation(user, data) {
  if (user.role !== "patient") throw new AppError("Only patients can start consultations", 403);
  const doctor = await DoctorProfile.findOne({
    user: data.doctor,
    consultationType: { $in: ["video", "both"] },
  });
  if (!doctor) throw new AppError("Doctor is not available for video consultation", 400);
  return Consultation.create({
    patient: user._id,
    doctor: data.doctor,
    symptoms: data.symptoms,
    price: data.price || 0,
    messages: data.initialMessage ? [{ sender: "patient", message: data.initialMessage }] : [],
  });
}

export async function listConsultations(user) {
  const filter = user.role === "doctor" ? { doctor: user._id } : { patient: user._id };
  return Consultation.find(filter)
    .populate("patient", userSelect)
    .populate("doctor", userSelect)
    .sort({ createdAt: -1 });
}

function canAccessConsultation(consultation, user) {
  return (user.role === "patient" && String(consultation.patient) === String(user._id))
    || (user.role === "doctor" && String(consultation.doctor) === String(user._id))
    || user.role === "admin";
}

export async function addConsultationMessage(user, consultationId, data) {
  const consultation = await Consultation.findById(consultationId);
  if (!consultation) throw new AppError("Consultation not found", 404);
  if (!canAccessConsultation(consultation, user)) throw new AppError("You cannot access this consultation", 403);
  if (consultation.status !== "active") throw new AppError("This consultation is no longer active", 400);
  consultation.messages.push({ sender: user.role, message: data.message });
  await consultation.save();
  return consultation;
}

export async function endConsultation(user, consultationId) {
  const consultation = await Consultation.findById(consultationId);
  if (!consultation) throw new AppError("Consultation not found", 404);
  if (!canAccessConsultation(consultation, user)) throw new AppError("You cannot access this consultation", 403);
  consultation.status = "completed";
  consultation.endedAt = new Date();
  await consultation.save();
  return consultation;
}
