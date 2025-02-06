import { z } from "zod";
import { VehicleBrandSchema } from "./vehicleBrandValidator";

export const vehicleModelSchema = z.object({// Optional because it's auto-generated
    vehicle_model_id: z.number().optional(),
    brand: VehicleBrandSchema,
    model_name: z.string()
        .min(2, "El nombre del modelo debe tener al menos 2 caracteres")
        .max(50, "El nombre del modelo no puede exceder los 50 caracteres")
});

export type VehicleModelInput = z.infer<typeof vehicleModelSchema>;