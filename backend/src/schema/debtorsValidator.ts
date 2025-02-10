import { z } from "zod";
import { WorkOrderSchema } from "./workOrderValidator";

export const DebtorSchema = z.object({
    debtor_id: z.number().optional(), // Optional because it's auto-generated
    work_order: WorkOrderSchema,
    description: z.string().min(1, { message: "La descripción no puede estar vacía" }).max(255, { message: "La descripción no puede exceder los 255 caracteres" }),
    created_at: z.date().optional()
});

export type DebtorInput = z.infer<typeof DebtorSchema>;