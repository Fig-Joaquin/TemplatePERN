import { z } from "zod";

export const WorkOrderTechnicianSchema = z.object({
  // Identificador único (opcional para creación)
  id: z.number().int().positive().optional(),

  // ID de la orden de trabajo a la que se asigna el técnico
  work_order_id: z.number().int().positive({
    message: "El ID de la orden de trabajo debe ser un número entero positivo",
  }),

  // ID del técnico (persona) que se asigna
  technician_id: z.number().int().positive({
    message: "El ID del técnico debe ser un número entero positivo",
  }),

  // Estado de la asignación: "active" o "inactive"
  status: z.enum(["active", "inactive"]).default("active"),

  // Fecha de asignación, se generará automáticamente; es opcional en la validación
  assigned_at: z.date().optional(),
});

// Esquema para actualización, permitiendo que todos los campos sean opcionales
export const UpdateWorkOrderTechnicianSchema = WorkOrderTechnicianSchema.partial();

export type WorkOrderTechnicianInput = z.infer<typeof WorkOrderTechnicianSchema>;
export type UpdateWorkOrderTechnicianInput = z.infer<typeof UpdateWorkOrderTechnicianSchema>;
