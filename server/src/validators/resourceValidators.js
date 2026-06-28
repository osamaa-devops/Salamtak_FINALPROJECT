import { z } from "zod";

const id = z.string().min(12);

export const appointmentSchema = z.object({
  body: z.object({
    doctor: id,
    date: z.coerce.date(),
    time: z.string().min(1),
    type: z.enum(["consultation", "followup", "emergency", "video", "checkup"]).optional(),
    symptoms: z.string().optional(),
    status: z.enum(["pending", "waiting", "confirmed", "completed", "cancelled"]).optional(),
    clinic: z.string().optional(),
    fee: z.number().optional(),
  }),
});

export const prescriptionSchema = z.object({
  body: z.object({
    patient: id,
    appointment: id.optional(),
    diagnosis: z.string().trim().min(2),
    medications: z.array(z.object({
      name: z.string().trim().min(1),
      dosage: z.string().trim().min(1),
      frequency: z.string().optional(),
      duration: z.string().optional(),
      instructions: z.string().optional(),
    })).min(1),
    notes: z.string().optional(),
  }),
});

export const medicationScheduleSchema = z.object({
  body: z.object({
    patient: id.optional(),
    medicationName: z.string().min(1),
    dosage: z.string().min(1),
    times: z.array(z.string().min(1)).min(1),
    isActive: z.boolean().optional(),
    nextDose: z.coerce.date().optional(),
    takenToday: z.array(z.string()).optional(),
  }),
});

export const orderSchema = z.object({
  body: z.object({
    pharmacy: id,
    items: z.array(z.object({
      medication: id,
      quantity: z.number().int().positive(),
    })).min(1),
    deliveryAddress: z.string().min(5),
    paymentMethod: z.enum(["card", "cash"]).default("card"),
  }),
});

export const reviewSchema = z.object({
  body: z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().min(10),
    category: z.enum(["doctor", "clinic", "lab", "hospital"]),
    targetId: id.optional(),
    targetName: z.string().min(2),
    categories: z.object({
      quality: z.number().min(0).max(5).optional(),
      waiting: z.number().min(0).max(5).optional(),
      staff: z.number().min(0).max(5).optional(),
      cleanliness: z.number().min(0).max(5).optional(),
      value: z.number().min(0).max(5).optional(),
    }).optional(),
  }),
});

export const consultationSchema = z.object({
  body: z.object({
    doctor: id,
    symptoms: z.string().min(2),
    price: z.number().optional(),
    initialMessage: z.string().optional(),
  }),
});

export const messageSchema = z.object({
  body: z.object({
    message: z.string().min(1),
  }),
  params: z.object({
    id,
  }),
});
