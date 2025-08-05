import { z } from "zod";

export const WorkPaymentSchema = z.object({
    // Optional because it's auto-generated
    payment_type_id: z.number().int().positive(),
    work_order_id: z.number().int().positive(),
    payment_status: z.string().max(50),
    amount_paid: z.number().nonnegative(), // For decimal validation
    payment_date: z.coerce.date()
});

// For creation (without ID)
export type CreateWorkPaymentInput = z.infer<typeof WorkPaymentSchema>;

// For validation of incoming data
export const validateWorkPayment = (data: unknown): CreateWorkPaymentInput => {
    return WorkPaymentSchema.parse(data);
};

// For partial updates
export const WorkPaymentUpdateSchema = WorkPaymentSchema.partial();
export type UpdateWorkPaymentInput = z.infer<typeof WorkPaymentUpdateSchema>;