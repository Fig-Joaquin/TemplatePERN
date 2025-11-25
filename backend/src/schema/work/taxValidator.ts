import { z } from "zod";

export const TaxSchema = z.object({
    code: z.string().max(50).optional(),
    name: z.string().max(100).optional(),
    tax_rate: z.number()
        .min(0, { message: "El impuesto no puede ser negativo" })
        .max(100, { message: "El impuesto no puede ser mayor al 100%" }),
    is_default: z.boolean().optional().default(false)
});

// Type definitions for TypeScript
export type TaxInput = z.infer<typeof TaxSchema>;