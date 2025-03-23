import { z } from "zod";

export const companiesSchema = z.object({
    company_id: z.number().int().positive().optional(),
    
    rut: z.string()
        .min(8, { message: "El RUT debe tener al menos 9 caracteres" })
        .max(10, { message: "El RUT no puede superar los 10 caracteres" }),

    name: z.string()
        .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
        .max(100, { message: "El nombre no puede superar los 100 caracteres" }),
    
    email: z.preprocess(
        (val) => {
            if (typeof val === "string" && val.trim() === "") {
            return undefined;
            }
            return val;
        },
        z.string()
            .email({ message: "Formato de email inválido" })
            .max(100, { message: "El email no puede superar los 100 caracteres" })
            .optional()
        ),
          

    phone: z.string()
        .min(7, { message: "El teléfono debe tener al menos 7 caracteres" })
        .max(12, { message: "El teléfono no puede superar los 12 caracteres" })
        .optional()
});

export const updateCompaniesSchema = companiesSchema.partial();

export type CompanyInput = z.infer<typeof companiesSchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompaniesSchema>;
