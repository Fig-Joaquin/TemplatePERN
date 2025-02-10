import { z } from "zod";

export const productHistorySchema = z.object({
    product_history_id: z.number().int().positive().optional(),

    product_id: z.number()
        .int({ message: "El ID del producto debe ser un número entero." })
        .positive({ message: "El ID del producto debe ser mayor a 0." }),

    description: z.string()
        .min(5, { message: "La descripción debe tener al menos 5 caracteres." })
        .max(500, { message: "La descripción no puede superar los 500 caracteres." }),

    last_purchase_price: z.number()
        .min(0, { message: "El precio de última compra no puede ser negativo." }),

    sale_price: z.number()
        .min(0, { message: "El precio de venta no puede ser negativo." }),

    updated_at: z.string()
        .datetime({ message: "Fecha inválida. Debe ser un formato de fecha válido." })
        .optional()
});

export const updateProductHistorySchema = productHistorySchema.partial();

export type ProductHistoryInput = z.infer<typeof productHistorySchema>;
export type UpdateProductHistoryInput = z.infer<typeof updateProductHistorySchema>;
