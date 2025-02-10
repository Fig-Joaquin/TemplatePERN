import { z } from "zod";
import { ProductSchema } from "./productValidator";

export const StockProductSchema = z.object({
    stock_product_id: z.number().optional(), // Optional because it's auto-generated
    product: ProductSchema,
    quantity: z.number().int().min(0, { message: "La cantidad no puede ser negativa" }),
    updated_at: z.date().optional()
});

export type StockProductInput = z.infer<typeof StockProductSchema>;