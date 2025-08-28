import { z } from "zod";



export const SupplierSchema = z.object({
    supplier_id: z.number().optional(), // Optional because it's auto-generated
    product_id: z.number().optional(),
    products: z.array(z.any()).optional(),
    name: z.string().min(2, {
        message: "El nombre del proveedor debe tener al menos 2 caracteres"
    }).max(100, {
        message: "El nombre del proveedor no puede tener más de 100 caracteres"
    }),
    address: z.string().max(255, {
        message: "La dirección no puede tener más de 255 caracteres"
    }).optional().or(z.literal("")),
    city: z.string().max(100, {
        message: "La ciudad no puede tener más de 100 caracteres"
    }).optional().or(z.literal("")),
    description: z.string().max(500, {
        message: "La descripción no puede tener más de 500 caracteres"
    }).optional().or(z.literal("")),
    phone: z.string().regex(/^56\d{9,13}$/, {
        message: "Formato inválido. Debe ser 569XXXXXXXX y tener entre 11 y 15 caracteres."
    })
});

export type SupplierInput = z.infer<typeof SupplierSchema>;