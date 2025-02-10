// src/routes/debtorsRoutes.ts
import { Router } from "express";
import { getAllDebtors, getDebtorById, createDebtor, updateDebtor, deleteDebtor } from "../controllers/debtorsController";

const debtorRoutes = Router();

// Al usar app.use("/debtors", debtorRoutes) en tu index, estas rutas serán relativas a "/debtors"
debtorRoutes.get("/", getAllDebtors);          // Obtiene todos los deudores
debtorRoutes.get("/:id", getDebtorById);         // Obtiene un deudor por ID
debtorRoutes.post("/", createDebtor);            // Crea un nuevo deudor
debtorRoutes.put("/:id", updateDebtor);          // Actualiza un deudor existente
debtorRoutes.delete("/:id", deleteDebtor);       // Elimina un deudor

export default debtorRoutes;
