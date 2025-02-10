import { z } from "zod";
import { ProductSchema } from "./productValidator";

export const ProductPurchaseSchema = z.object({
    tax_id: z.number().int().positive(),
    product_id: z.number().int().positive(),
    product: ProductSchema.optional(),
    purchase_status: z.enum(["processed", "returned"]),
    purchase_price: z.number().min(0, "El precio de compra no puede ser negativo"),
    quantity: z.number().int().min(1, "La cantidad debe ser al menos 1"),
    total_price: z.number().min(0, "El precio total no puede ser negativo")
});

export type ProductPurchaseInput = z.infer<typeof ProductPurchaseSchema>;