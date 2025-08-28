import { z } from "zod";

// Función para validar dígito verificador del RUT
const validateRutDv = (rut: string): boolean => {
  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1).toUpperCase();
  
  let suma = 0;
  let multiplicador = 2;
  
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const resto = suma % 11;
  const dvCalculado = 11 - resto;
  
  let dvEsperado: string;
  if (dvCalculado === 11) dvEsperado = '0';
  else if (dvCalculado === 10) dvEsperado = 'K';
  else dvEsperado = dvCalculado.toString();
  
  return dv === dvEsperado;
};

export const PersonSchema = z.object({
    person_id: z.number().int().positive().optional(),
    rut: z
    .string()
    .trim()
    .optional()
    .transform(val => (val === "" ? undefined : val))
    .refine(val => val === undefined || /^[0-9kK]{8,9}$/.test(val), {
      message: "RUT debe contener solo números y dígito verificador (K)",
    })
    .refine(val => val === undefined || (val.length >= 8 && val.length <= 9), {
      message: "RUT debe tener entre 8 y 9 caracteres sin puntos ni guión",
    })
    .refine(val => val === undefined || validateRutDv(val), {
      message: "Dígito verificador del RUT es incorrecto",
    }),
    
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
        .max(50, "Segundo apellido no puede superar los 50 caracteres")
        .optional(),
    
    email: z
        .string()
        .email("Email debe tener un formato válido")
        .max(100, "Email no puede superar los 100 caracteres"),
    
    number_phone: z
        .string()
        .min(7, "Teléfono debe tener entre 7 y 15 caracteres")
        .max(15, "Teléfono debe tener entre 7 y 15 caracteres"),
    
    person_type: z
        .enum(["cliente", "proveedor"], {
            errorMap: () => ({ message: "Tipo de persona debe ser 'cliente' o 'proveedor'" })
        })
});

// Esquema para creación de usuario con persona (RUT obligatorio)
export const PersonForUserSchema = z.object({
    person_id: z.number().int().positive().optional(),
    rut: z
    .string()
    .trim()
    .min(8, "RUT es requerido")
    .max(9, "RUT no puede tener más de 9 caracteres")
    .refine(val => /^[0-9kK]{8,9}$/.test(val), {
      message: "RUT debe contener solo números y dígito verificador (K)",
    })
    .refine(val => validateRutDv(val), {
      message: "Dígito verificador del RUT es incorrecto",
    }),
    
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