import { z } from "zod";

export const PersonSchema = z.object({
    person_id: z.number().int().positive().optional(),
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
        .transform(val => (val.trim() === "" ? undefined : val))
        .optional()
        .refine(val => (val == null || val.length >= 2), {
          message: "Segundo apellido debe tener entre 2 y 50 caracteres",
        })
        .refine(val => (val == null || val.length <= 50), {
          message: "Segundo apellido debe tener entre 2 y 50 caracteres",
        }),

        email: z
        .string()
        .optional()
        .transform((val) => (val?.trim() === "" ? undefined : val?.trim()))
        .refine(
          (val) => val == null || val.length >= 5, 
          { message: "Email debe tener entre 5 y 100 caracteres" }
        )
        .refine(
          (val) => val == null || val.length <= 100, 
          { message: "Email debe tener entre 5 y 100 caracteres" }
        )
        .refine(
          (val) => val == null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
          { message: "Email inválido" }
        ),
      

    number_phone: z
        .string()
        .regex(/^\+?56[0-9]{9}$/, "Formato de teléfono inválido. Debe ser formato chileno (+56)"),

    person_type: z.enum(["trabajador", "cliente", "administrador"], {
    errorMap: () => ({ message: "El tipo de persona debe ser 'trabajador', 'cliente' o 'administrador'" })
  }),
});

export const UpdatePersonSchema = PersonSchema.partial();

export type PersonInput = z.infer<typeof PersonSchema>;
export type UpdatePersonInput = z.infer<typeof UpdatePersonSchema>;