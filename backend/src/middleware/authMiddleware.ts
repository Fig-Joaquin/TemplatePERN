import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extender Request para incluir la propiedad user
export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateUser = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ message: "Acceso no autorizado" });
    return; // 🔹 Asegura que devuelva `void`, no un `Response`
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_default");
    req.user = decoded; // 🔹 Usa `as any` para evitar errores de tipado en `req.user`
    next(); // 🔹 Siempre llama a `next()` en caso de éxito
  } catch (error) {
    res.status(403).json({ message: "Token inválido o expirado" });
    return; // 🔹 Asegura que devuelva `void`
  }
};