import { z } from "zod";
import { TipoGastoSchema } from "./tipoGastoValidator";

export const GastoSchema = z.object({
    id_gasto_empresa: z.number().int().positive().optional(), // Opcional porque es autogenerado
    id_tipo_gasto: z.number().int().positive(),
    tipo_gasto: TipoGastoSchema.optional(),
    descripcion: z.string().min(1, { message: "La descripción no puede estar vacía" }),
    monto: z.number()
        .min(0, { message: "El monto no puede ser negativo" })
        .multipleOf(0.01),
    fecha_gasto: z.coerce.date(),
    numero_boleta: z.string().max(50).optional()
});

export const UpdateGastoSchema = GastoSchema.partial();

export type GastoInput = z.infer<typeof GastoSchema>;
export type UpdateGastoInput = z.infer<typeof UpdateGastoSchema>;