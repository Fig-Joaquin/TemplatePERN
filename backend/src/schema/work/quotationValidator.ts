import { z } from "zod";
import { vehicleSchema } from "../vehicles/vehicleValidator";

export const QuotationSchema = z.object({
    vehicle_id: z.number().int().positive(),
    total_price: z.number().int().positive(),
    vehicle: vehicleSchema.optional(),
    description: z.union([
        z.string().min(3).max(1000),
        z.literal(""),
        z.undefined()
    ]).optional(),
    quotation_status: z.enum(["approved", "rejected", "pending"]).default("pending"),
    
});

export const QuotationUpdateSchema = z.object({
    vehicle_id: z.number().int().positive().optional(),
    total_price: z.number().int().positive().optional(),
    vehicle: vehicleSchema.optional(),
    description: z.union([
        z.string().min(3).max(1000),
        z.literal(""),
        z.null(),
        z.undefined()
    ]).optional(),
    quotation_status: z.enum(["approved", "rejected", "pending"]).optional(),
}).partial();

export type QuotationInput = z.infer<typeof QuotationSchema>;
export type QuotationUpdateInput = z.infer<typeof QuotationUpdateSchema>;