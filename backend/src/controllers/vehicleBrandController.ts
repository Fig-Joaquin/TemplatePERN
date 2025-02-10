import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/ormconfig";
import { VehicleBrand } from "../entities/vehicleBrandEntity";
import { VehicleBrandSchema, updateVehicleBrandSchema } from "../schema/vehicleBrandValidator";
import { QueryFailedError } from "typeorm";

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

export const getModelsByBrand = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const brand = await vehicleBrandRepository.findOne({
            where: { vehicle_brand_id: parseInt(id) },
            relations: ["models"]
        });
        if (!brand) {
            res.status(404).json({ message: "Marca de vehículo no encontrada" });
            return;
        }
        res.json(brand.models);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los modelos de la marca de vehículo", error });
    }
};

export const createVehicleBrand = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        // Validar con Zod
        const validationResult = VehicleBrandSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: "Error de validación",
                errors: validationResult.error.errors.map(err => ({
                    field: err.path.join("."),
                    message: err.message
                }))
            });
            return;
        }

        const { brand_name } = validationResult.data;

        // Verificar si la marca ya existe antes de insertarla
        const existingBrand = await vehicleBrandRepository.findOneBy({ brand_name });
        if (existingBrand) {
            res.status(409).json({ 
                message: `La marca '${brand_name}' ya existe.`,
                brand: existingBrand
            });
            return;
        }

        // Crear la marca si no existe
        const brand = vehicleBrandRepository.create(validationResult.data);
        await vehicleBrandRepository.save(brand);
        res.status(201).json({ message: "Marca creada exitosamente", brand });
    } catch (error) {
        if (error instanceof QueryFailedError) {
            // Manejar errores específicos de PostgreSQL
            if ((error as any).code === "23505") {
                res.status(409).json({
                    message: `La marca '${req.body.brand_name}' ya existe en la base de datos.`,
                    error: (error as any).detail
                });
                return;
            }
        }

        res.status(500).json({ 
            message: "Error interno al crear la marca de vehículo",
            error: error instanceof Error ? error.message : error
        });
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