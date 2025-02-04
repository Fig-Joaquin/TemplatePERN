import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extender Request para incluir la propiedad user
interface AuthRequest extends Request {
  user?: any;
}

export const authenticateUser = (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
  const token = req.cookies?.token; // Asegúrate de que estás usando cookie-parser

  if (!token) {
    return res.status(401).json({ message: "Acceso no autorizado" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_default");
    req.user = decoded; // Ahora TypeScript reconoce la propiedad
    next(); // Aseguramos que siempre avanzamos en el flujo del middleware
  } catch (error) {
    return res.status(403).json({ message: "Token inválido o expirado" });
  }
};
