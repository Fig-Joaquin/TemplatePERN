import { z } from "zod";
import { QuotationSchema } from "./quotationValidator";
import { vehicleSchema } from "../vehicles/vehicleValidator";

export const WorkOrderSchema = z.object({
    vehicle_id: z.number().int().positive(),
    quotation_id: z.number().int().positive().optional(), // Ahora es opcional
    vehicle: vehicleSchema.optional(),  
    quotation: QuotationSchema.optional(),
    total_amount: z.number().min(0, { message: "El monto total no puede ser negativo" }),
    order_status: z.enum(["finished", "in_progress", "not_started"]).default("not_started"), // Se valida el estado permitido
    description: z.string().min(5, {
        message: "La descripción debe tener al menos 10 caracteres"
    }).max(1000, {
        message: "La descripción no puede exceder los 1000 caracteres"
    }),

});

export type WorkOrderInput = z.infer<typeof WorkOrderSchema>;