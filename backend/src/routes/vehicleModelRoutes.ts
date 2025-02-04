import { Router } from "express";
import {

getAllVehicleModels,
getVehicleModelById,
createVehicleModel,
updateVehicleModel,
deleteVehicleModel,
} from "../controllers/vehicleModelController";

const vehicleModelRoutes = Router();

vehicleModelRoutes.get("/", getAllVehicleModels);          // Obtener todos los modelos de vehículo
vehicleModelRoutes.get("/:id", getVehicleModelById);         // Obtener un modelo de vehículo por ID
vehicleModelRoutes.post("/", createVehicleModel);            // Crear un nuevo modelo de vehículo
vehicleModelRoutes.put("/:id", updateVehicleModel);          // Actualizar un modelo de vehículo
vehicleModelRoutes.delete("/:id", deleteVehicleModel);       // Eliminar un modelo de vehículo

export default vehicleModelRoutes;