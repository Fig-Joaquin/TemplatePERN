import { validate } from "class-validator";

// Tipo de resultado de validación
export type ValidationResult<T> = {
    success: boolean;
    data?: T;
    errors?: string[];
};

export class ClassValidatorAdapter {
    static async validate<T extends object>(entity: T): Promise<ValidationResult<T>> {
        const errors = await validate(entity);
        if (errors.length > 0) {
            // Extraer mensajes de error
            const errorMessages = errors.map((err) =>
                Object.values(err.constraints || {}).join(", ")
            );
            return { success: false, errors: errorMessages };
        }
        return { success: true, data: entity };
    }
}
