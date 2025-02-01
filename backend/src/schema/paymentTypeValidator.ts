import { z } from "zod";

export const PaymentTypeSchema = z.object({
    payment_type_id: z.number().optional(), // Optional because it's auto-generated
    type_name: z.string()
        .min(2, { message: "El nombre del tipo de pago debe tener al menos 2 caracteres" })
        .max(50, { message: "El nombre del tipo de pago no puede tener más de 50 caracteres" })
});

export type PaymentTypeInput = z.infer<typeof PaymentTypeSchema>;