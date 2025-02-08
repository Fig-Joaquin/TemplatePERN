import { z } from "zod";

export const suppliersSchema = z.object({
    supplier_id: z.number().int().positive().optional(),

    name: z.string()
        .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
        .max(100, { message: "El nombre no puede superar los 100 caracteres" }),

    address: z.string()
        .min(5, { message: "La dirección debe tener al menos 5 caracteres" })
        .max(255, { message: "La dirección no puede superar los 255 caracteres" }),

    city: z.string()
        .min(2, { message: "La ciudad debe tener al menos 2 caracteres" })
        .max(100, { message: "La ciudad no puede superar los 100 caracteres" }),

    description: z.string()
        .min(5, { message: "La descripción debe tener al menos 5 caracteres" })
        .max(500, { message: "La descripción no puede superar los 500 caracteres" }),

    phone: z.string()
        .regex(/^56\d{9,13}$/, { message: "Formato inválido. Debe ser 569XXXXXXXX y tener entre 11 y 15 caracteres." })
        .min(11, { message: "El número debe tener al menos 11 caracteres." })
        .max(15, { message: "El número no puede superar los 15 caracteres." })
});

export const updateSuppliersSchema = suppliersSchema.partial();

export type SupplierInput = z.infer<typeof suppliersSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSuppliersSchema>;
