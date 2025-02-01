import { z } from "zod";

export const UserSchema = z.object({
    id_usuario: z.number().optional(), // Optional because it's auto-generated
    id_persona: z.number(),
    rol_usuario: z.string()
        .min(3, "Rol de usuario debe tener entre 3 y 20 caracteres")
        .max(20, "Rol de usuario debe tener entre 3 y 20 caracteres"),
    nombre_usuario: z.string()
        .min(4, "Nombre de usuario debe tener entre 4 y 30 caracteres")
        .max(30, "Nombre de usuario debe tener entre 4 y 30 caracteres")
        .regex(/^[a-zA-Z0-9_]+$/, "Nombre de usuario solo puede contener letras, números y guión bajo"),
    contrasenia: z.string()
        .min(8, "Contraseña debe tener al menos 8 caracteres")
        .max(60, "Contraseña no puede exceder 60 caracteres")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            "Contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial"
        )
});

export type UserInput = z.infer<typeof UserSchema>;