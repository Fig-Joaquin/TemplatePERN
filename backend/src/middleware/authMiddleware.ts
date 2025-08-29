import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extender Request para incluir la propiedad user
export interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
    userRole: string;
    person: {
      person_id: number;
      name: string;
      first_surname: string;
      second_surname?: string;
      rut?: string;
      email?: string;
      number_phone: string;
      person_type: string;
    };
  };
}

export const authenticateUser = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ message: "Acceso no autorizado" });
    return; // 🔹 Asegura que devuelva `void`, no un `Response`
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_default") as {
      userId: number;
      username: string;
      userRole: string;
      person: {
        person_id: number;
        name: string;
        first_surname: string;
        second_surname?: string;
        rut?: string;
        email?: string;
        number_phone: string;
        person_type: string;
      };
    };
    req.user = decoded;
    next(); // 🔹 Siempre llama a `next()` en caso de éxito
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

    // Debug: log the user information
    console.log("Usuario autenticado:", req.user);
    console.log("Rol del usuario:", req.user.userRole);

    // Verificar si es administrador
    if (req.user.userRole !== "administrador") {
      res.status(403).json({ 
        message: "Acceso denegado. Solo los administradores pueden realizar esta acción." 
      });
      return;
    }

    // Si es administrador, continuar
    next();
  });
};