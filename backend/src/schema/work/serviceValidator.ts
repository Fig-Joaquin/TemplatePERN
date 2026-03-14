import { z } from "zod";

export const ServiceSchema = z.object({
    service_id: z.number().optional(),
    service_name: z.string()
        .min(2, { message: "El nombre del servicio debe tener al menos 2 caracteres" })
        .max(100, { message: "El nombre del servicio no puede tener más de 100 caracteres" }),
    description: z.string().optional(),
    base_price: z.number()
        .positive({ message: "El precio base debe ser un valor positivo" }),
    is_active: z.boolean().optional()
});

export type ServiceInput = z.infer<typeof ServiceSchema>;
