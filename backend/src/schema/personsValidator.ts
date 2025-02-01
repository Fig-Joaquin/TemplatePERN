import { z } from "zod";

export const PersonSchema = z.object({
    rut: z
        .string()
        .min(8, "RUT debe tener entre 8 y 9 caracteres sin puntos ni guión")
        .max(9, "RUT debe tener entre 8 y 9 caracteres sin puntos ni guión")
        .regex(/^[0-9kK]{8,9}$/, "Formato de RUT inválido"),

    name: z
        .string()
        .min(2, "Nombre debe tener entre 2 y 50 caracteres")
        .max(50, "Nombre debe tener entre 2 y 50 caracteres"),

    first_surname: z
        .string()
        .min(2, "Primer apellido debe tener entre 2 y 50 caracteres")
        .max(50, "Primer apellido debe tener entre 2 y 50 caracteres"),

    second_surname: z
        .string()
        .min(2, "Segundo apellido debe tener entre 2 y 50 caracteres")
        .max(50, "Segundo apellido debe tener entre 2 y 50 caracteres")
        .optional(),

    email: z
        .string()
        .email("Email inválido")
        .min(5, "Email debe tener entre 5 y 100 caracteres")
        .max(100, "Email debe tener entre 5 y 100 caracteres"),

    number_phone: z
        .string()
        .regex(/^\+?56[0-9]{9}$/, "Formato de teléfono inválido. Debe ser formato chileno (+56)"),

    person_type: z
        .string()
        .min(2, "Tipo de persona debe tener entre 2 y 20 caracteres")
        .max(20, "Tipo de persona debe tener entre 2 y 20 caracteres"),
});

export const UpdatePersonSchema = PersonSchema.partial();

export type PersonInput = z.infer<typeof PersonSchema>;
export type UpdatePersonInput = z.infer<typeof UpdatePersonSchema>;