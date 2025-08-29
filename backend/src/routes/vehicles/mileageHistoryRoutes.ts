import { Router } from "express";
import { 

getAllMileageHistories, 
getMileageHistoryById, 
createMileageHistory, 
updateMileageHistory, 
deleteMileageHistory 
} from "../../controllers/vehicles/mileageHistoryController";
import { requireAdmin, authenticateUser } from "../../middleware/authMiddleware";

const mileageHistoryRoutes = Router();

// Obtener todos los historiales de kilometraje (requiere autenticación)
mileageHistoryRoutes.get("/", authenticateUser, getAllMileageHistories);

// Obtener un historial de kilometraje por ID (requiere autenticación)
mileageHistoryRoutes.get("/:id", authenticateUser, getMileageHistoryById);

// Crear un nuevo historial de kilometraje (solo administradores)
mileageHistoryRoutes.post("/", requireAdmin, createMileageHistory);

// Actualizar un historial de kilometraje existente (solo administradores)
mileageHistoryRoutes.put("/:id", requireAdmin, updateMileageHistory);

// Eliminar un historial de kilometraje (solo administradores)
mileageHistoryRoutes.delete("/:id", requireAdmin, deleteMileageHistory);

export default mileageHistoryRoutes;