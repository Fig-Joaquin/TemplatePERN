import { z } from "zod";
import { vehicleSchema } from "./vehicleValidator";

export const QuotationSchema = z.object({
    vehicle_id: z.number().int().positive(),
    vehicle: vehicleSchema.optional(),
    person_id: z.number().int().positive().optional(),
    company_id: z.number().int().positive().optional(),
    description: z.string().min(10, {
        message: "La descripción debe tener al menos 10 caracteres"
    }).max(1000, {
        message: "La descripción no puede exceder los 1000 caracteres"
    }),
    quotation_status: z.enum(["approved", "rejected", "pending"]).default("pending"),
    
});

export type QuotationInput = z.infer<typeof QuotationSchema>;