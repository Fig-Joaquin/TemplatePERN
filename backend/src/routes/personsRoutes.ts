// src/routes/personRoutes.ts
import { Router } from "express";
import { getAllPersons, getPersonById, createPerson, updatePerson, deletePerson } from "../controllers/personsController";

const personRoutes = Router();

// Si usas app.use("/persons", personRoutes) en tu index.ts,
// las rutas definidas aquí son relativas a "/persons".

personRoutes.get("/", getAllPersons);          // Obtiene todas las personas
personRoutes.get("/:id", getPersonById);         // Obtiene una persona por ID
personRoutes.post("/", createPerson);            // Crea una nueva persona
personRoutes.put("/:id", updatePerson);          // Actualiza una persona existente
personRoutes.delete("/:id", deletePerson);       // Elimina una persona

export default personRoutes;
