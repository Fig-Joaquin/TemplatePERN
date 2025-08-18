import { z } from "zod";
import { vehicleSchema } from "../vehicles/vehicleValidator";

export const QuotationSchema = z.object({
    vehicle_id: z.number().int().positive(),
    total_price: z.number().int().positive(),
    vehicle: vehicleSchema.optional(),
    description: z.string().min(3).max(1000).optional(),
    quotation_status: z.enum(["approved", "rejected", "pending"]).default("pending"),
    
});

export type QuotationInput = z.infer<typeof QuotationSchema>;