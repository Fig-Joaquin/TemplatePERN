import { Request, Response } from "express";
import { AppDataSource } from "../config/ormconfig";
import { Vehicle } from "../entities/VehicleTEST";
import { vehicleSchema } from "../schema/vehicleValidator";
import { ValidationAdapter } from "../adapters/validationAdapter";
import { ClassValidatorAdapter } from "../adapters/classValidatorAdapter";

// * Obtener todos los vehículos
export const getVehicles = async (_: Request, res: Response): Promise<void> => {
    try {
        const vehicleRepository = AppDataSource.getRepository(Vehicle);
        const vehicles = await vehicleRepository.find();
        res.status(200).json(vehicles);
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// *Crear un nuevo vehículo
export const createVehicle = async (req: Request, res: Response): Promise<void> => {
    const validation = ValidationAdapter.validate(vehicleSchema, req.body);

    if (!validation.success) {
        res.status(400).json({ errors: validation.errors });
        return;
    }

    const { brand, model, year, isActive } = validation.data!;

  // Validar la entidad con class-validator usando el adaptador
    const vehicle = new Vehicle();
    vehicle.brand = brand;
    vehicle.model = model;
    vehicle.year = year;
    vehicle.isActive = isActive ?? false;

    const entityValidation = await ClassValidatorAdapter.validate(vehicle);
    if (!entityValidation.success) {
        res.status(400).json({ errors: entityValidation.errors });
        return;
    }

    try {
        const vehicleRepository = AppDataSource.getRepository(Vehicle);
        const newVehicle = await vehicleRepository.save(vehicle);
        res.status(201).json(newVehicle);
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};