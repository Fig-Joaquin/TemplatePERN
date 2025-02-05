// src/utils/errorHandler.ts
import { Response } from "express";

/**
 * Maneja errores y envía una respuesta JSON con el mensaje de error.
 * @param res Objeto Response de Express
 * @param message Mensaje de error
 * @param error Error opcional para depuración
 */
export const handleError = (res: Response, message: string, error?: unknown): void => {
    console.error(message, error);
    res.status(500).json({ message, error: error instanceof Error ? error.message : error });
};
