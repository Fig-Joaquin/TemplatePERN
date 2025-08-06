import { z } from "zod";
import { QuotationSchema } from "./quotationValidator";
import { vehicleSchema } from "../vehicles/vehicleValidator";

// Base schema object without transform
const WorkOrderSchemaBase = z.object({
    vehicle_id: z.number().int().positive(),
    quotation_id: z.number().int().positive().optional(), // Ahora es opcional
    vehicle: vehicleSchema.optional(),  
    quotation: QuotationSchema.optional(),
    total_amount: z.number().min(0, { message: "El monto total no puede ser negativo" }),
    order_status: z.enum(["finished", "in_progress", "not_started"]).default("not_started"), // Se valida el estado permitido
    work_order_status: z.enum(["finished", "in_progress", "not_started"]).default("not_started").optional(), // Support both names
    description: z.string().min(5, {
        message: "La descripción debe tener al menos 5 caracteres"
    }).max(1000, {
        message: "La descripción no puede exceder los 1000 caracteres"
    }),
});

// Schema with transform for creation
export const WorkOrderSchema = WorkOrderSchemaBase.transform((data) => {
    // Handle both order_status and work_order_status field names
    if (data.work_order_status && !data.order_status) {
        return { ...data, order_status: data.work_order_status };
    }
    return data;
});

// Schema for updates (partial of base schema with transform)
export const WorkOrderUpdateSchema = WorkOrderSchemaBase.partial().transform((data) => {
    // Handle both order_status and work_order_status field names
    if (data.work_order_status && !data.order_status) {
        return { ...data, order_status: data.work_order_status };
    }
    return data;
});

export type WorkOrderInput = z.infer<typeof WorkOrderSchema>;