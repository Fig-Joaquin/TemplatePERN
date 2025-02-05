// src/controllers/authController.ts
import { Request, Response, RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AppDataSource } from "../config/ormconfig";
import { User } from "../entities/usersEntity";

export const login: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: "Faltan credenciales" });
    return;
  }

  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { username },
      relations: ["person"],
    });

    if (!user) {
      res.status(401).json({ message: "Usuario no encontrado" });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ message: "Contraseña incorrecta" });
      return;
    }

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username },
      process.env.JWT_SECRET || "secret_default",
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    res.json({ message: "Login exitoso", token });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const logoutUser: RequestHandler = (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  res.status(200).json({ message: "Logout exitoso" });
};

export const checkSession: RequestHandler = (req: Request, res: Response): void => {
  console.log("Cookies recibidas:", req.cookies); // 🔍 Depuración

  const token = req.cookies?.token; // ← Cambia `session` por `token`
  if (!token) {
    res.status(401).json({ error: "No autenticado, cookie no encontrada" });
    return; 
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    res.json({ user: decoded });
  } catch (error) {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};
