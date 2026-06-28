import * as service from "../services/catalogService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const doctors = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listDoctors(req.query) });
});

export const videoDoctors = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await service.listVideoDoctors() });
});

export const patients = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listPatients(req.user, req.query) });
});

export const patientProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getPatientProfile(req.user._id) });
});

export const updatePatientProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.updatePatientProfile(req.user._id, req.body) });
});

export const doctorProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getDoctorProfile(req.user._id) });
});

export const updateDoctorProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.updateDoctorProfile(req.user._id, req.body) });
});

export const appointments = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listAppointments(req.user, req.query) });
});

export const createAppointment = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.createAppointment(req.user, req.body) });
});

export const updateAppointment = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.updateAppointment(req.params.id, req.body, req.user) });
});

export const prescriptions = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listPrescriptions(req.user) });
});

export const createPrescription = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.createPrescription(req.user, req.body) });
});

export const medicationSchedules = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listMedicationSchedules(req.user) });
});

export const createMedicationSchedule = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.createMedicationSchedule(req.user, req.body) });
});

export const updateMedicationSchedule = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.updateMedicationSchedule(req.params.id, req.body, req.user) });
});

export const deleteMedicationSchedule = asyncHandler(async (req, res) => {
  await service.deleteMedicationSchedule(req.params.id, req.user);
  res.status(204).send();
});

export const reminders = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listReminders(req.user) });
});

export const markReminderRead = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.markReminderRead(req.params.id, req.user) });
});

export const pharmacies = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listPharmacies(req.query) });
});

export const createOrder = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.createOrder(req.user, req.body) });
});

export const orders = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listOrders(req.user) });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.cancelOrder(req.user, req.params.id) });
});

export const reviews = asyncHandler(async (req, res) => {
  const [items, stats] = await Promise.all([
    service.listReviews(req.query),
    service.getReviewStats(req.query.category, req.query.targetId),
  ]);
  res.json({ success: true, data: { items, stats } });
});

export const createReview = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.createReview(req.user, req.body) });
});

export const markReviewHelpful = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.markReviewHelpful(req.params.id, req.user) });
});

export const startConsultation = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.startConsultation(req.user, req.body) });
});

export const consultations = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listConsultations(req.user) });
});

export const addConsultationMessage = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.addConsultationMessage(req.user, req.params.id, req.body) });
});

export const endConsultation = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.endConsultation(req.user, req.params.id) });
});
