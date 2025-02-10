import { Router } from "express";
import {

// src/routes/vehicleBrandRoutes.ts
    getAllVehicleBrands,
    getVehicleBrandById,
    createVehicleBrand,
    updateVehicleBrand,
    deleteVehicleBrand,
    getModelsByBrand
} from "../controllers/vehicles/vehicleBrandController";

const vehicleBrandRoutes = Router();

vehicleBrandRoutes.get("/", getAllVehicleBrands);          // Obtener todas las marcas de vehículos
vehicleBrandRoutes.get("/:id", getVehicleBrandById);         // Obtener una marca de vehículo por ID
vehicleBrandRoutes.post("/", createVehicleBrand);            // Crear una nueva marca de vehículo
vehicleBrandRoutes.put("/:id", updateVehicleBrand);          // Actualizar una marca de vehículo existente
vehicleBrandRoutes.delete("/:id", deleteVehicleBrand);       // Eliminar una marca de vehículo
vehicleBrandRoutes.get("/:id/models", getModelsByBrand);     // Obtener los modelos de una marca de vehículo

export default vehicleBrandRoutes;