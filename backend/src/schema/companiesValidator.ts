import { z } from "zod";

export const companiesSchema = z.object({
    company_id: z.number().int().positive().optional(),
    
    rut: z.string()
        .min(9, { message: "El RUT debe tener al menos 9 caracteres" })
        .max(10, { message: "El RUT no puede superar los 10 caracteres" })
        .regex(/^[0-9]{8,9}[0-9Kk]$/, { message: "El RUT debe contener solo números y una 'K' opcional al final" }),

    name: z.string()
        .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
        .max(100, { message: "El nombre no puede superar los 100 caracteres" }),

    email: z.string()
        .email({ message: "Formato de email inválido" })
        .max(100, { message: "El email no puede superar los 100 caracteres" })
});

export const updateCompaniesSchema = companiesSchema.partial();

export type CompanyInput = z.infer<typeof companiesSchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompaniesSchema>;
