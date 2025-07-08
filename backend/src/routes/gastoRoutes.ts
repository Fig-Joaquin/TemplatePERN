import { Router } from "express";
import {
    getAllGastos,
    getGastoById,
    createGasto,
    updateGasto,
    deleteGasto
} from "../controllers/gastoController";

const router = Router();

// Obtener todos los gastos
router.get("/", getAllGastos);

// Obtener un gasto por ID
router.get("/:id", getGastoById);

// Crear un nuevo gasto
router.post("/", createGasto);

// Actualizar un gasto existente
router.put("/:id", updateGasto);

// Eliminar un gasto
router.delete("/:id", deleteGasto);

export default router;