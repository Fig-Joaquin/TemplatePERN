import { z } from "zod";

export const QuotationSchema = z.object({
    vehicle_id: z.number().int().positive(),
    mileage_history_id: z.number().int().positive(),
    description: z.string().min(10, {
        message: "La descripción debe tener al menos 10 caracteres"
    }).max(1000, {
        message: "La descripción no puede exceder los 1000 caracteres"
    }),
    quotation_status: z.string().max(50, {
        message: "El estado de la cotización no puede exceder los 50 caracteres"
    }),
    entry_date: z.string().datetime().or(z.date())
});

export type QuotationInput = z.infer<typeof QuotationSchema>;