import { z } from "zod";

export const TipoGastoSchema = z.object({
    expense_type_id: z.number().int().positive().optional(), // Opcional porque es autogenerado
    expense_type_name: z.string()
        .min(2, { message: "El nombre del tipo de gasto debe tener al menos 2 caracteres" })
        .max(100, { message: "El nombre del tipo de gasto no puede exceder los 100 caracteres" }),
    description: z.string().optional()
});

export const UpdateTipoGastoSchema = TipoGastoSchema.partial();

export type TipoGastoInput = z.infer<typeof TipoGastoSchema>;
export type UpdateTipoGastoInput = z.infer<typeof UpdateTipoGastoSchema>;