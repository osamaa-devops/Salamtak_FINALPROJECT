import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as controller from "../controllers/catalogController.js";
import * as aiController from "../controllers/aiChatController.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  appointmentSchema,
  consultationSchema,
  medicationScheduleSchema,
  messageSchema,
  orderSchema,
  prescriptionSchema,
  reviewSchema,
} from "../validators/resourceValidators.js";

export const apiRoutes = Router();
const aiChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ success: false, message: "You have sent too many messages. Please wait a few minutes." }),
});

apiRoutes.get("/doctors", controller.doctors);
apiRoutes.get("/doctors/video", controller.videoDoctors);
apiRoutes.get("/pharmacies", controller.pharmacies);
apiRoutes.get("/reviews", controller.reviews);

apiRoutes.use(protect);

apiRoutes.get("/patients", authorize("doctor", "admin"), controller.patients);
apiRoutes.get("/profile/patient", authorize("patient"), controller.patientProfile);
apiRoutes.patch("/profile/patient", authorize("patient"), controller.updatePatientProfile);
apiRoutes.get("/profile/doctor", authorize("doctor"), controller.doctorProfile);
apiRoutes.patch("/profile/doctor", authorize("doctor"), controller.updateDoctorProfile);

apiRoutes.get("/ai/conversations", authorize("patient"), aiController.conversations);
apiRoutes.post("/ai/conversations", authorize("patient"), aiController.createConversation);
apiRoutes.get("/ai/conversations/:conversationId/messages", authorize("patient"), aiController.history);
apiRoutes.get("/ai/history", authorize("patient"), aiController.history);
apiRoutes.post("/ai/chat", authorize("patient"), aiChatLimiter, aiController.chat);
apiRoutes.delete("/ai/conversations/:conversationId", authorize("patient"), aiController.clear);
apiRoutes.delete("/ai/conversation", authorize("patient"), aiController.clear);

apiRoutes.get("/appointments", controller.appointments);
apiRoutes.post("/appointments", validate(appointmentSchema), controller.createAppointment);
apiRoutes.patch("/appointments/:id", controller.updateAppointment);

apiRoutes.get("/prescriptions", controller.prescriptions);
apiRoutes.post("/prescriptions", authorize("doctor"), validate(prescriptionSchema), controller.createPrescription);

apiRoutes.get("/medication-schedules", authorize("patient"), controller.medicationSchedules);
apiRoutes.post("/medication-schedules", authorize("patient"), validate(medicationScheduleSchema), controller.createMedicationSchedule);
apiRoutes.patch("/medication-schedules/:id", authorize("patient"), controller.updateMedicationSchedule);
apiRoutes.delete("/medication-schedules/:id", authorize("patient"), controller.deleteMedicationSchedule);

apiRoutes.get("/reminders", controller.reminders);
apiRoutes.patch("/reminders/:id/read", controller.markReminderRead);

apiRoutes.post("/orders", authorize("patient"), validate(orderSchema), controller.createOrder);
apiRoutes.get("/orders", authorize("patient", "admin"), controller.orders);
apiRoutes.patch("/orders/:id/cancel", authorize("patient"), controller.cancelOrder);
apiRoutes.post("/reviews", authorize("patient"), validate(reviewSchema), controller.createReview);
apiRoutes.patch("/reviews/:id/helpful", controller.markReviewHelpful);

apiRoutes.post("/consultations", authorize("patient"), validate(consultationSchema), controller.startConsultation);
apiRoutes.get("/consultations", controller.consultations);
apiRoutes.post("/consultations/:id/messages", validate(messageSchema), controller.addConsultationMessage);
apiRoutes.patch("/consultations/:id/end", controller.endConsultation);
