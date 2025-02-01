import { z } from "zod";

export const PurchaseHistorySchema = z.object({
    purchase_history_id: z.number().optional(),
    purchase_date: z.date(),
    arrival_date: z.date(),
    description: z.string().min(10, {
        message: "La descripción debe tener al menos 10 caracteres"
    }).max(500, {
        message: "La descripción no puede exceder los 500 caracteres"
    }),
    purchases: z.array(z.object({
        product_id: z.number(),
        quantity: z.number().positive(),
        unit_price: z.number().positive()
    })).optional()
});

export type PurchaseHistoryInput = z.infer<typeof PurchaseHistorySchema>;