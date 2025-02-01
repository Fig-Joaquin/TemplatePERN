import { z } from "zod";

export const ProductTypeSchema = z.object({
    product_type_id: z.number().optional(),
    product_category_id: z.number(),
    type_name: z.string().min(2, {
        message: "El nombre del tipo debe tener al menos 2 caracteres"
    }).max(50, {
        message: "El nombre del tipo no puede exceder los 50 caracteres"
    })
});

export type ProductTypeInput = z.infer<typeof ProductTypeSchema>;