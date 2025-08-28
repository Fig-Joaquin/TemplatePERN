import { z } from "zod";
import { WorkOrderSchema } from "./workOrderValidator";

export const DebtorSchema = z.object({
    debtor_id: z.number().optional(), // Optional because it's auto-generated
    work_order_id: z.number().int().positive(),
    work_order: WorkOrderSchema.optional(),
    description: z.string().min(1, { message: "La descripción no puede estar vacía" }).max(255, { message: "La descripción no puede exceder los 255 caracteres" }),
    total_amount: z.number().positive().optional(),
    paid_amount: z.number().min(0).optional(),
    payment_status: z.enum(["pendiente", "parcial", "pagado"]).optional(),
    created_at: z.date().optional()
});

export const PaymentSchema = z.object({
    payment_amount: z.number().positive({ message: "El monto del pago debe ser positivo" }),
    payment_date: z.string().optional()
});

export type DebtorInput = z.infer<typeof DebtorSchema>;
export type PaymentInput = z.infer<typeof PaymentSchema>;