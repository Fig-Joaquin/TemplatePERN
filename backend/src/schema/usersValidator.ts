import { z } from "zod";
import { PersonSchema } from "./personsValidator";

export const UserSchema = z.object({ // Optional because it's auto-generated
    user_id: z.number().optional(),
    person_id: z.number().int().positive(),
    person: PersonSchema.optional(),
    user_role: z.string()
        .min(3, "Rol de usuario debe tener entre 3 y 20 caracteres")
        .max(20, "Rol de usuario debe tener entre 3 y 20 caracteres"),
    username: z.string()
        .min(4, "Nombre de usuario debe tener entre 4 y 30 caracteres")
        .max(30, "Nombre de usuario debe tener entre 4 y 30 caracteres")
        .regex(/^[a-zA-Z0-9_]+$/, "Nombre de usuario solo puede contener letras, números y guión bajo"),
    password: z.string()
        .min(8, "Contraseña debe tener al menos 8 caracteres")
        .max(60, "Contraseña no puede exceder 60 caracteres")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            "Contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial"
        )
});

export const UpdateUserSchema = UserSchema.partial();

export type UserInput = z.infer<typeof UserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;