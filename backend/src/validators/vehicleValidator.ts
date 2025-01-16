import { z } from "zod";

export const vehicleSchema = z.object({
    brand: z.string().min(1, "Brand is required"),
    model: z.string().min(1, "Model is required"),
    year: z.number().int().min(1886, "Year must be valid").max(new Date().getFullYear()),
    isActive: z.boolean().default(true), // Valor predeterminado si no está presente
});
