// src/routes/userRoutes.ts
import { Router } from "express";
import { 
  createUser, 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  loginUser 
} from "../controllers/userController";

const userRoutes = Router();

// Rutas para manejo de usuarios
userRoutes.post("/", createUser);        // Crear usuario
userRoutes.get("/", getAllUsers);          // Listar todos los usuarios
userRoutes.get("/:id", getUserById);       // Obtener usuario por ID
userRoutes.put("/:id", updateUser);        // Actualizar usuario
userRoutes.delete("/:id", deleteUser);     // Eliminar usuario

// Ruta de login para usuarios
userRoutes.post("/login", loginUser);

export default userRoutes;
