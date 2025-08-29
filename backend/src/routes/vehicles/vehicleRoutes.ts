import { Router } from "express";
import { 

getAllVehicles, 
getVehicleById, 
createVehicle, 
updateVehicle, 
deleteVehicle, 
getVehiclesByPersonId,
getVehicleByLicensePlate
} from "../../controllers/vehicles/vehicleController";
import { requireAdmin } from "../../middleware/authMiddleware";

const vehicleRoutes = Router();

vehicleRoutes.get("/", getAllVehicles);          // Obtiene todos los vehículos
vehicleRoutes.get("/license/:licensePlate", getVehicleByLicensePlate); // Obtiene un vehículo por patente
vehicleRoutes.get("/:id", getVehicleById);         // Obtiene un vehículo por ID
vehicleRoutes.get("/person/:personId", getVehiclesByPersonId); // Obtiene los vehículos de un propietario
vehicleRoutes.post("/", requireAdmin, createVehicle);            // Crea un nuevo vehículo (solo admin)
vehicleRoutes.put("/:id", requireAdmin, updateVehicle);          // Actualiza un vehículo existente (solo admin)
vehicleRoutes.delete("/:id", requireAdmin, deleteVehicle);       // Elimina un vehículo (solo admin)
export default vehicleRoutes;