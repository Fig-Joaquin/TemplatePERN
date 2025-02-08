import { z } from "zod";

export const debtorsSchema = z.object({
    debtor_id: z.number().int().positive().optional(),

    work_order_id: z.number()
        .int({ message: "El ID de la orden de trabajo debe ser un número entero." })
        .positive({ message: "El ID de la orden de trabajo debe ser mayor a 0." }),

    description: z.string()
        .min(5, { message: "La descripción debe tener al menos 5 caracteres." })
        .max(255, { message: "La descripción no puede superar los 255 caracteres." }),

    created_at: z.string()
        .datetime({ message: "Fecha inválida. Debe ser un formato de fecha válido." })
        .optional()
});

export const updateDebtorsSchema = debtorsSchema.partial();

export type DebtorInput = z.infer<typeof debtorsSchema>;
export type UpdateDebtorInput = z.infer<typeof updateDebtorsSchema>;
