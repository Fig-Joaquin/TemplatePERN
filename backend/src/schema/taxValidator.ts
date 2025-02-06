import { z } from "zod";

export const TaxSchema = z.object({
    tax_id: z.number().positive().optional(),
    tax_rate: z.number()
        .min(0, { message: "El impuesto no puede ser negativo" })
        .max(100, { message: "El impuesto no puede ser mayor al 100%" })
});

// Type definitions for TypeScript
export type TaxInput = z.infer<typeof TaxSchema>;