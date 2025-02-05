import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/ormconfig";
import { Vehicle } from "../entities/vehicleEntity";
import { vehicleSchema } from "../schema/vehicleValidator";
import { VehicleModel } from "../entities/vehicleModelEntity";
import { Person } from "../entities/personsEntity";
import { MileageHistory } from "../entities/mileageHistoryEntity";
import { DeepPartial } from "typeorm";


// src/controllers/vehicleController.ts

const vehicleRepository = AppDataSource.getRepository(Vehicle);

export const getAllVehicles = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const vehicles = await vehicleRepository
            .createQueryBuilder("vehicle")
            .leftJoinAndSelect("vehicle.model", "model")
            .leftJoinAndSelect("model.brand", "brand")
            .leftJoinAndSelect("vehicle.owner", "owner")
            .leftJoinAndSelect("vehicle.mileage_history", "mileage_history")
            .getMany();

        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener vehículos", error });
    }
};

export const getVehicleById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const vehicle = await vehicleRepository.findOne({
            where: { vehicle_id: parseInt(id) },
            relations: ["model", "model.brand", "owner", "mileage_history"]
        });
        if (!vehicle) {
            res.status(404).json({ message: "Vehículo no encontrado" });
            return;
        }
        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener vehículo", error });
    }
};

const modelRepository = AppDataSource.getRepository(VehicleModel);
const ownerRepository = AppDataSource.getRepository(Person);
const mileageHistoryRepository = AppDataSource.getRepository(MileageHistory);

export const createVehicle = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        // Validar la entrada
        const validationResult = vehicleSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ errors: validationResult.error.errors });
            return;
        }

        // Extraer datos relacionales y demás datos del vehículo.
        // Se espera que el frontend envíe vehicle_model_id, person_id y mileageHistory (para el primer registro de kilometraje).
        const { vehicle_model_id, person_id, ...vehicleData } = validationResult.data;
        const mileageHistoryData = req.body.mileageHistory;

        // Verificar y obtener el modelo
        const model = await modelRepository.findOneBy({ vehicle_model_id });
        if (!model) {
            res.status(404).json({ message: "Modelo no encontrado" });
            return;
        }

        // Verificar y obtener el dueño
        const owner = await ownerRepository.findOneBy({ person_id });
        if (!owner) {
            res.status(404).json({ message: "Dueño no encontrado" });
            return;
        }

        // Verificar que se proporcione el primer registro de kilometraje
        if (!mileageHistoryData || !Array.isArray(mileageHistoryData) || mileageHistoryData.length === 0) {
            res.status(400).json({ message: "Se requiere el primer registro de kilometraje en el historial" });
            return;
        }
        
        // Crear el primer registro del historial de kilometraje
        const initialMileageRecord = mileageHistoryRepository.create(mileageHistoryData[0]);

        const vehicle = vehicleRepository.create({
            ...vehicleData,
            model,
            owner,
            mileage_history: [initialMileageRecord] // Se pasa como array para que la cascada funcione correctamente
        } as unknown as DeepPartial<Vehicle>);

        // Guardar el vehículo (la cascada se encargará de guardar el historial de kilometraje)
        await vehicleRepository.save(vehicle);
        res.status(201).json(vehicle);
    } catch (error) {
        res.status(500).json({ message: "Error al crear vehículo", error });
    }
};

export const updateVehicle = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const vehicle = await vehicleRepository.findOneBy({ vehicle_id: parseInt(id) });
        if (!vehicle) {
            res.status(404).json({ message: "Vehículo no encontrado" });
            return;
        }

        // Usar un esquema parcial para actualizar
        const updateSchema = vehicleSchema.partial();
        const validationResult = updateSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ errors: validationResult.error.errors });
            return;
        }

        vehicleRepository.merge(vehicle, validationResult.data);
        await vehicleRepository.save(vehicle);
        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar vehículo", error });
    }
};

export const deleteVehicle = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const vehicle = await vehicleRepository.findOne({
            where: { vehicle_id: parseInt(id) },
            relations: ["mileage_history"]
        });

        if (!vehicle) {
            res.status(404).json({ message: "Vehículo no encontrado" });
            return;
        }

        // Verificar y eliminar los registros relacionados en "mileage_history"
        if (vehicle.mileage_history && vehicle.mileage_history.length > 0) {
            await mileageHistoryRepository.createQueryBuilder()
                .delete()
                .from("mileage_history")
                .where("vehicle_id = :id", { id: vehicle.vehicle_id })
                .execute();
        }

        // Ahora eliminar el vehículo
        await vehicleRepository.createQueryBuilder()
            .delete()
            .from("vehicles")
            .where("vehicle_id = :id", { id: vehicle.vehicle_id })
            .execute();

        res.json({ message: "Vehículo y su historial de kilometraje eliminado exitosamente" });
    } catch (error) {
        console.error("Error al eliminar vehículo:", error);
        res.status(500).json({ message: "Error al eliminar vehículo", error });
    }
};
