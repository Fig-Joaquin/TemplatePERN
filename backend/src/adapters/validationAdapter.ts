import { ZodError, ZodSchema } from "zod";

// Tipo genérico para los datos validados
export type ValidationResult<T> = {
    success: boolean;
    data?: T;
    errors?: string[];
};

export class ValidationAdapter {
    static validate<T>(schema: ZodSchema<T>, input: unknown): ValidationResult<T> {
        try {
            const data = schema.parse(input);
            return { success: true, data };
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((err) => err.message);
                return { success: false, errors };
            }
            // En caso de otro tipo de error inesperado
            return { success: false, errors: ["Unexpected validation error"] };
        }
    }
}
