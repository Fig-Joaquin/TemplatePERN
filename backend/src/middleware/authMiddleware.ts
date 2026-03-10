import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types/auth";

// Extend Request to include the authenticated user payload
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authenticateUser = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ message: "Acceso no autorizado" });
    return; // 🔹 Asegura que devuelva `void`, no un `Response`
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ message: "Token inválido o expirado" });
    return; // 🔹 Asegura que devuelva `void`
  }
};

// Middleware para verificar que el usuario sea administrador
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Primero verificar autenticación
  authenticateUser(req, res, () => {
    // Si llegamos aquí, el usuario está autenticado
    if (!req.user) {
      res.status(401).json({ message: "Usuario no autenticado" });
      return;
    }

    if (req.user.userRole !== "administrador") {
      res.status(403).json({
        message: "Acceso denegado. Solo los administradores pueden realizar esta acción.",
      });
      return;
    }

    next();
  });
};