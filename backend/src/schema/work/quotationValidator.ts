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
    // Nuevos campos para mantener la tasa de IVA histórica
    tax_rate: z.number()
        .min(0, { message: "La tasa de impuesto no puede ser negativa" })
        .max(100, { message: "La tasa de impuesto no puede ser mayor al 100%" })
        .optional(),
    subtotal: z.number().min(0).optional(),
    tax_amount: z.number().min(0).optional(),
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
    // Nuevos campos para mantener la tasa de IVA histórica
    tax_rate: z.number()
        .min(0, { message: "La tasa de impuesto no puede ser negativa" })
        .max(100, { message: "La tasa de impuesto no puede ser mayor al 100%" })
        .optional(),
    subtotal: z.number().min(0).optional(),
    tax_amount: z.number().min(0).optional(),
}).partial();

export type QuotationInput = z.infer<typeof QuotationSchema>;
export type QuotationUpdateInput = z.infer<typeof QuotationUpdateSchema>;