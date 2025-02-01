import { z } from "zod";

export const VehicleBrandSchema = z.object({
    brand_name: z.string()
        .min(2, "El nombre de la marca debe tener al menos 2 caracteres")
        .max(50, "El nombre de la marca no puede exceder los 50 caracteres")
});

export const updateVehicleBrandSchema = VehicleBrandSchema.partial();

export type CreateVehicleBrandInput = z.infer<typeof VehicleBrandSchema>;
export type UpdateVehicleBrandInput = z.infer<typeof updateVehicleBrandSchema>;