import { z } from "zod";

export const MileageHistorySchema = z.object({
    vehicle_id: z.number().int().positive(),
    current_mileage: z.number().int().min(0, { message: "El kilometraje no puede ser negativo" }),
    registration_date: z.coerce.date()
});

export const updateMileageHistorySchema = MileageHistorySchema.partial();

export type CreateMileageHistoryInput = z.infer<typeof MileageHistorySchema>;
export type UpdateMileageHistoryInput = z.infer<typeof updateMileageHistorySchema>;