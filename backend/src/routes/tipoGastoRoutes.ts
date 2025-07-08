import { Router } from "express";
import {
    getAllTiposGasto,
    getTipoGastoById,
    createTipoGasto,
    updateTipoGasto,
    deleteTipoGasto
} from "../controllers/tipoGastoController";

const router = Router();

// Obtener todos los tipos de gasto
router.get("/", getAllTiposGasto);

// Obtener un tipo de gasto por ID
router.get("/:id", getTipoGastoById);

// Crear un nuevo tipo de gasto
router.post("/", createTipoGasto);

// Actualizar un tipo de gasto existente
router.put("/:id", updateTipoGasto);

// Eliminar un tipo de gasto
router.delete("/:id", deleteTipoGasto);

export default router;