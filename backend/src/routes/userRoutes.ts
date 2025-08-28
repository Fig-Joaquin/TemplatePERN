// src/routes/userRoutes.ts
import { Router } from "express";
import { 
  createUser, 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  loginUser,
  createUserWithPerson
} from "../controllers/userController";

const userRoutes = Router();

// Rutas para manejo de usuarios
userRoutes.post("/", createUser);        // Crear usuario (con person_id existente)
userRoutes.post("/create-with-person", createUserWithPerson); // Crear usuario con persona nueva
userRoutes.get("/", getAllUsers);          // Listar todos los usuarios
userRoutes.get("/:id", getUserById);       // Obtener usuario por ID
userRoutes.put("/:id", updateUser);        // Actualizar usuario
userRoutes.delete("/:id", deleteUser);     // Eliminar usuario

// Ruta de login para usuarios
userRoutes.post("/login", loginUser);

export default userRoutes;
