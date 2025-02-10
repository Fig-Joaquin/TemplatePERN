import { z } from "zod";
import { PersonSchema } from "./personsValidator";
import { vehicleSchema } from "./vehicleValidator";
import { QuotationSchema } from "./quotationValidator";

export const WorkOrderSchema = z.object({
    vehicle_id: z.number().int().positive(),
    person_id: z.number().int().positive(),
    quotation_id: z.number().int().positive(),
    vehicle: vehicleSchema.optional(),  
    person: PersonSchema.optional(),
    quotation: QuotationSchema.optional(),
    total_amount: z.number().min(0, { message: "El monto total no puede ser negativo" }),
    order_status: z.enum(["finished", "in_progress", "not_started" ]).default("not_started"),
    order_date: z.coerce.date().optional()
});

export type WorkOrderInput = z.infer<typeof WorkOrderSchema>;