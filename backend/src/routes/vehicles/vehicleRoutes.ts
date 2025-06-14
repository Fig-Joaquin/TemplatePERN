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

const vehicleRoutes = Router();

vehicleRoutes.get("/", getAllVehicles);          // Obtiene todos los vehículos
vehicleRoutes.get("/license/:licensePlate", getVehicleByLicensePlate); // Obtiene un vehículo por patente
vehicleRoutes.get("/:id", getVehicleById);         // Obtiene un vehículo por ID
vehicleRoutes.get("/person/:personId", getVehiclesByPersonId); // Obtiene los vehículos de un propietario
vehicleRoutes.post("/", createVehicle);            // Crea un nuevo vehículo
vehicleRoutes.put("/:id", updateVehicle);          // Actualiza un vehículo existente
vehicleRoutes.delete("/:id", deleteVehicle);       // Elimina un vehículo
export default vehicleRoutes;