import { PersonSchema } from "../../schema/personsValidator";
import { z } from "zod";
import { vehicleModelSchema } from "./vehicleModelValidator";


export const vehicleSchema = z.object({
    vehicle_id: z.number().optional(),
    vehicle_model_id: z.number().int().positive(),
    person_id: z.number().int().positive().optional(),
    company_id: z.number().int().positive().optional(),
    model: vehicleModelSchema.optional(),
    owner: PersonSchema.optional(),
    license_plate: z.string()
        .min(6, "La patente debe tener entre 6 y 8 caracteres")
        .max(8, "La patente debe tener entre 6 y 8 caracteres"),
    vehicle_status: z.enum(["running", "not_running"]).default("running"),
    year: z.number()
        .int()
        .min(1900, "El año no puede ser menor a 1900")
        .max(new Date().getFullYear() + 1, "El año no puede ser mayor al próximo año"),
    color: z.string()
        .min(3, "El color debe tener entre 3 y 30 caracteres")
        .max(30, "El color debe tener entre 3 y 30 caracteres")
});

export type VehicleInput = z.infer<typeof vehicleSchema>;