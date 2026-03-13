import { z } from "zod";
import { WorkOrderSchema } from "./workOrderValidator";
import { parseCLP } from "../../utils/currency";

const clpIntegerSchema = (isRequired = false) => {
    const baseSchema = z.preprocess((value) => {
        if (value === undefined || value === null || value === "") {
            return undefined;
        }

        if (typeof value === "number") {
            return Math.trunc(value);
        }

        if (typeof value === "string") {
            if (!/\d/.test(value)) {
                return undefined;
            }
            return parseCLP(value);
        }

        return value;
    }, z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER));

    if (isRequired) {
        return z.preprocess((value) => {
            if (value === undefined || value === null || value === "") {
                return value;
            }

            if (typeof value === "number") {
                return Math.trunc(value);
            }

            if (typeof value === "string") {
                if (!/\d/.test(value)) {
                    return value;
                }
                return parseCLP(value);
            }

            return value;
        }, z.number().int().positive().max(Number.MAX_SAFE_INTEGER));
    }

    return baseSchema.optional();
};

export const DebtorSchema = z.object({
    debtor_id: z.number().optional(), // Optional because it's auto-generated
    work_order_id: z.number().int().positive(),
    work_order: WorkOrderSchema.optional(),
    description: z.string().min(1, { message: "La descripción no puede estar vacía" }).max(255, { message: "La descripción no puede exceder los 255 caracteres" }),
    total_amount: clpIntegerSchema().refine((value) => value === undefined || value > 0, {
        message: "El monto total debe ser mayor a 0"
    }),
    paid_amount: clpIntegerSchema(),
    payment_status: z.enum(["pendiente", "parcial", "pagado"]).optional(),
    created_at: z.date().optional()
});

export const PaymentSchema = z.object({
    payment_amount: clpIntegerSchema(true),
    payment_date: z.string().optional()
});

export type DebtorInput = z.infer<typeof DebtorSchema>;
export type PaymentInput = z.infer<typeof PaymentSchema>;