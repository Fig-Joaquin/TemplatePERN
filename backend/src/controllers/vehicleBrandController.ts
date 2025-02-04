import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/ormconfig";
import { VehicleBrand } from "../entities/vehicleBrandEntity";
import { VehicleBrandSchema, updateVehicleBrandSchema } from "../schema/vehicleBrandValidator";

// src/controllers/vehicleBrandController.ts

const vehicleBrandRepository = AppDataSource.getRepository(VehicleBrand);

export const getAllVehicleBrands = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const brands = await vehicleBrandRepository.find();
        res.json(brands);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener marcas de vehículo", error });
    }
};

export const getVehicleBrandById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const brand = await vehicleBrandRepository.findOneBy({ vehicle_brand_id: parseInt(id) });
        if (!brand) {
            res.status(404).json({ message: "Marca de vehículo no encontrada" });
            return;
        }
        res.json(brand);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener la marca de vehículo", error });
    }
};

export const createVehicleBrand = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = VehicleBrandSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ errors: validationResult.error.errors });
            return;
        }
        const brand = vehicleBrandRepository.create(validationResult.data);
        await vehicleBrandRepository.save(brand);
        res.status(201).json(brand);
    } catch (error) {
        res.status(500).json({ message: "Error al crear la marca de vehículo", error });
    }
};

export const updateVehicleBrand = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const brand = await vehicleBrandRepository.findOneBy({ vehicle_brand_id: parseInt(id) });
        if (!brand) {
            res.status(404).json({ message: "Marca de vehículo no encontrada" });
            return;
        }

        const updateSchema = updateVehicleBrandSchema;
        const validationResult = updateSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ errors: validationResult.error.errors });
            return;
        }

        vehicleBrandRepository.merge(brand, validationResult.data);
        await vehicleBrandRepository.save(brand);
        res.json(brand);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar la marca de vehículo", error });
    }
};

export const deleteVehicleBrand = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await vehicleBrandRepository.delete(parseInt(id));
        if (result.affected === 0) {
            res.status(404).json({ message: "Marca de vehículo no encontrada" });
            return;
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar la marca de vehículo", error });
    }
};