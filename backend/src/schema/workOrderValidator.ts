import { z } from "zod";

export const WorkOrderSchema = z.object({
    vehicle_id: z.number().int().positive(),
    quotation_id: z.number().int().positive(),
    person_id: z.number().int().positive(),
    mileage_history_id: z.number().int().positive(),
    total_amount: z.number().min(0, { message: "El monto total no puede ser negativo" }),
    order_status: z.enum(["finished", "in_progress", "not_started"]),
    order_date: z.coerce.date()
});

export type WorkOrderInput = z.infer<typeof WorkOrderSchema>;