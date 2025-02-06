import { z } from "zod";
import { vehicleSchema } from "./vehicleValidator";

export const MileageHistorySchema = z.object({
    current_mileage: z.number().int().min(0, { message: "El kilometraje no puede ser negativo" }),
    registration_date: z.coerce.date(),
    vehicle: vehicleSchema  // Se añade la validación de la entidad vehicle
});

export const updateMileageHistorySchema = MileageHistorySchema.partial();

export type CreateMileageHistoryInput = z.infer<typeof MileageHistorySchema>;
export type UpdateMileageHistoryInput = z.infer<typeof updateMileageHistorySchema>;