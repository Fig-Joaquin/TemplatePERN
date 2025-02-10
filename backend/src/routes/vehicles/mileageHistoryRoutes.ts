import { Router } from "express";
import { 

getAllMileageHistories, 
getMileageHistoryById, 
createMileageHistory, 
updateMileageHistory, 
deleteMileageHistory 
} from "../../controllers/vehicles/mileageHistoryController";

const mileageHistoryRoutes = Router();

// Obtener todos los historiales de kilometraje
mileageHistoryRoutes.get("/", getAllMileageHistories);

// Obtener un historial de kilometraje por ID
mileageHistoryRoutes.get("/:id", getMileageHistoryById);

// Crear un nuevo historial de kilometraje
mileageHistoryRoutes.post("/", createMileageHistory);

// Actualizar un historial de kilometraje existente
mileageHistoryRoutes.put("/:id", updateMileageHistory);

// Eliminar un historial de kilometraje
mileageHistoryRoutes.delete("/:id", deleteMileageHistory);

export default mileageHistoryRoutes;