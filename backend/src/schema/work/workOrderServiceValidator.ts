import { z } from "zod";

export const workOrderServiceSchema = z.object({
    service_id: z.number().int().positive({ message: "El ID del servicio debe ser un número entero positivo" }),
    cantidad: z.number().int().min(1, { message: "La cantidad debe ser al menos 1" }),
    precio_unitario: z.number().nonnegative({ message: "El precio unitario no puede ser negativo" }),
});

export const updateWorkOrderServiceSchema = z.object({
    cantidad: z.number().int().min(1, { message: "La cantidad debe ser al menos 1" }).optional(),
    precio_unitario: z.number().nonnegative({ message: "El precio unitario no puede ser negativo" }).optional(),
});

export type WorkOrderServiceInput = z.infer<typeof workOrderServiceSchema>;
export type UpdateWorkOrderServiceInput = z.infer<typeof updateWorkOrderServiceSchema>;
