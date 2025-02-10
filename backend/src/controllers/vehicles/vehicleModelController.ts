import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { VehicleBrand, VehicleModel } from "../../entities"; // nuevo import
import { vehicleModelSchema } from "../../schema/vehicles/vehicleModelValidator";

// src/controllers/vehicleModelController.ts

const vehicleModelRepository = AppDataSource.getRepository(VehicleModel);
const vehicleBrandRepository = AppDataSource.getRepository(VehicleBrand); // nuevo repository

export const getAllVehicleModels = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const models = await vehicleModelRepository.find({
            relations: ["brand"],
        });
        res.json(models);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener modelos de vehículo", error });
    }
};

export const getVehicleModelById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const model = await vehicleModelRepository.findOne({
            where: { vehicle_model_id: parseInt(id) },
            relations: ["brand"],
        });
        if (!model) {
            res.status(404).json({ message: "Modelo de vehículo no encontrado" });
            return;
        }
        res.json(model);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el modelo de vehículo", error });
    }
};



export const createVehicleModel = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = vehicleModelSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ errors: validationResult.error.errors });
            return;
        }

        // Extraer vehicle_brand_id y buscar la marca
        const { vehicle_brand_id, ...rest } = validationResult.data;
        const brand = await vehicleBrandRepository.findOneBy({ vehicle_brand_id });
        if (!brand) {
            res.status(400).json({ message: "La marca del vehículo no existe" });
            return;
        }

        const model = vehicleModelRepository.create({ ...rest, brand }); // asociar la marca
        await vehicleModelRepository.save(model);
        res.status(201).json(model);
    } catch (error) {
        res.status(500).json({ message: "Error al crear el modelo de vehículo", error });
    }
};

export const updateVehicleModel = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const model = await vehicleModelRepository.findOneBy({ vehicle_model_id: parseInt(id) });
        if (!model) {
            res.status(404).json({ message: "Modelo de vehículo no encontrado" });
            return;
        }

        const updateSchema = vehicleModelSchema.partial();
        const validationResult = updateSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ errors: validationResult.error.errors });
            return;
        }

        vehicleModelRepository.merge(model, validationResult.data);
        await vehicleModelRepository.save(model);
        res.json(model);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el modelo de vehículo", error });
    }
};

export const deleteVehicleModel = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await vehicleModelRepository.delete(parseInt(id));
        if (result.affected === 0) {
            res.status(404).json({ message: "Modelo de vehículo no encontrado" });
            return;
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el modelo de vehículo", error });
    }
};