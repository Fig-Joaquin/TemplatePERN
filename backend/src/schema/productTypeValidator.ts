import { z } from "zod";
import { ProductCategorySchema } from "./productCategoryValidator";

export const ProductTypeSchema = z.object({
    category: ProductCategorySchema,
    type_name: z.string().min(2, {
        message: "El nombre del tipo debe tener al menos 2 caracteres"
    }).max(50, {
        message: "El nombre del tipo no puede exceder los 50 caracteres"
    })
});

export type ProductTypeInput = z.infer<typeof ProductTypeSchema>;