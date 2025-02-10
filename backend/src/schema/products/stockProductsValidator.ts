import { z } from "zod";

export const stockProductsSchema = z.object({
    stock_product_id: z.number().int().positive().optional(),

    product_id: z.number()
        .int({ message: "El ID del producto debe ser un número entero." })
        .positive({ message: "El ID del producto debe ser mayor a 0." }),

    quantity: z.number()
        .int({ message: "La cantidad debe ser un número entero." })
        .min(0, { message: "La cantidad no puede ser negativa." }),

    updated_at: z.string().datetime({ message: "Fecha inválida. Debe ser un formato de fecha válido." }).optional()
});

export const updateStockProductsSchema = stockProductsSchema.partial();

export type StockProductInput = z.infer<typeof stockProductsSchema>;
export type UpdateStockProductInput = z.infer<typeof updateStockProductsSchema>;
