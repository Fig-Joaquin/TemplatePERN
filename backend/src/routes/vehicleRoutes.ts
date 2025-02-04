import { Router } from "express";
import { 

getAllVehicles, 
getVehicleById, 
createVehicle, 
updateVehicle, 
deleteVehicle 
} from "../controllers/vehicleController";

const vehicleRoutes = Router();

vehicleRoutes.get("/", getAllVehicles);          // Obtiene todos los vehículos
vehicleRoutes.get("/:id", getVehicleById);         // Obtiene un vehículo por ID
vehicleRoutes.post("/", createVehicle);            // Crea un nuevo vehículo
vehicleRoutes.put("/:id", updateVehicle);          // Actualiza un vehículo existente
vehicleRoutes.delete("/:id", deleteVehicle);       // Elimina un vehículo

export default vehicleRoutes;