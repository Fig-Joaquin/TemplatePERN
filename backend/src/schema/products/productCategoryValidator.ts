import { z } from "zod";

export const ProductCategorySchema = z.object({
    product_category_id: z.number().optional(), // Optional because it's auto-generated
    category_name: z.string().min(2, {
        message: "El nombre de la categoría debe tener al menos 2 caracteres"
    }).max(50, {
        message: "El nombre de la categoría no puede tener más de 50 caracteres"
    })
});

export type ProductCategoryInput = z.infer<typeof ProductCategorySchema>;