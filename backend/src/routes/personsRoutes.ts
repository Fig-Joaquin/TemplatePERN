// src/routes/personRoutes.ts
import { Router } from "express";
import { getAllPersons, getPersonById, createPerson, updatePerson, deletePerson } from "../controllers/personsController";
import { requireAdmin, authenticateUser } from "../middleware/authMiddleware";

const personRoutes = Router();

// Si usas app.use("/persons", personRoutes) en tu index.ts,
// las rutas definidas aquí son relativas a "/persons".

personRoutes.get("/", authenticateUser, getAllPersons);          // Obtiene todas las personas (requiere autenticación)
personRoutes.get("/:id", authenticateUser, getPersonById);       // Obtiene una persona por ID (requiere autenticación)
personRoutes.post("/", requireAdmin, createPerson);              // Crea una nueva persona (solo administradores)
personRoutes.put("/:id", requireAdmin, updatePerson);            // Actualiza una persona existente (solo administradores)
personRoutes.delete("/:id", requireAdmin, deletePerson);         // Elimina una persona (solo administradores)

export default personRoutes;
