import { z } from "zod";

export const workProductDetailSchema = z.object({
    work_order_id: z.number().int().positive().optional(),
    product_id: z.number().int().positive(),
    quotation_id: z.number().int().positive().optional(),
    tax_id: z.number().int().positive(),
    applied_tax_rate: z.number()
        .min(0, { message: "La tasa de impuesto no puede ser negativa" })
        .max(100, { message: "La tasa de impuesto no puede ser mayor al 100%" })
        .optional(),
    quantity: z.number().int().min(1, { message: "La cantidad debe ser al menos 1" }),
    sale_price: z.number().nonnegative({ message: "El precio de venta no puede ser negativo" }),
    discount: z.number().nonnegative({ message: "El descuento no puede ser negativo" }).max(100),
    labor_price: z.number().nonnegative({ message: "El precio de mano de obra no puede ser negativo" })
});

export type WorkProductDetailInput = z.infer<typeof workProductDetailSchema>;