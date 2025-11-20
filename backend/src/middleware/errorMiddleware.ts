import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

interface CustomError {
  status?: number;
  message?: string;
  errors?: any[];
}

export const errorHandler = (err: CustomError | Error | ZodError, _req: Request, res: Response, _next: NextFunction): void => {
  console.error("Error:", err);

  // Si es un error de validación de Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Error de validación",
      errors: err.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }))
    });
    return;
  }

  // Si es un error personalizado con status
  if ('status' in err && err.status) {
    res.status(err.status).json({
      message: err.message || "Error del servidor",
      errors: err.errors || undefined
    });
    return;
  }

  // Error genérico del servidor
  res.status(500).json({
    message: "Error interno del servidor",
    error: err.message
  });
};
