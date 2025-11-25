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
    // Nuevos campos para mantener la tasa de IVA histórica
    tax_rate: z.number()
        .min(0, { message: "La tasa de impuesto no puede ser negativa" })
        .max(100, { message: "La tasa de impuesto no puede ser mayor al 100%" })
        .optional(),
    subtotal: z.number().min(0).optional(),
    tax_amount: z.number().min(0).optional(),
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