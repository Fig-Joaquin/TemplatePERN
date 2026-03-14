import { Router } from "express";
import {
    getAllServices,
    getServiceById,
    createService,
    updateService,
    deactivateService,
    activateService
} from "../../controllers/work/serviceController";

const router = Router();

// Obtener todos los servicios
router.get("/", getAllServices);

// Obtener un servicio por ID
router.get("/:id", getServiceById);

// Crear un nuevo servicio
router.post("/", createService);

// Actualizar un servicio existente
router.put("/:id", updateService);

// Desactivar un servicio (soft delete)
router.patch("/:id/deactivate", deactivateService);

// Activar un servicio
router.patch("/:id/activate", activateService);

export default router;
