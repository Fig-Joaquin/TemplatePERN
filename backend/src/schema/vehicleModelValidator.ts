import { z } from "zod";

export const vehicleModelSchema = z.object({
    vehicle_model_id: z.number().optional(), // Optional because it's auto-generated
    vehicle_brand_id: z.number().min(1, "Se requiere un ID de marca válido"),
    model_name: z.string()
        .min(2, "El nombre del modelo debe tener al menos 2 caracteres")
        .max(50, "El nombre del modelo no puede exceder los 50 caracteres")
});

export type VehicleModelInput = z.infer<typeof vehicleModelSchema>;