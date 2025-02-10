import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/ormconfig";
import { Vehicle } from "../entities/vehicleEntity";
import { vehicleSchema } from "../schema/vehicleValidator";
import { VehicleModel } from "../entities/vehicleModelEntity";
import { Person } from "../entities/personsEntity";
import { MileageHistory } from "../entities/mileageHistoryEntity";
import { DeepPartial, QueryFailedError } from "typeorm";


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

export const getVehiclesByPersonId = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { personId } = req.params;
        const vehicles = await vehicleRepository.find({
            where: { owner: { person_id: parseInt(personId) } },
            relations: ["model", "model.brand", "owner", "mileage_history"]
        });
        if (vehicles.length === 0) {
            res.status(404).json({ message: "No se encontraron vehículos para el propietario especificado" });
            return;
        }
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener vehículos por propietario", error });
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
        console.log("Body:", req.body);
        const validationResult = vehicleSchema.safeParse(req.body);
        if (!validationResult.success) {
            console.log("Error de validación:", validationResult.error.errors);
            res.status(400).json({
                message: "Error de validación",
                errors: validationResult.error.errors.map(err => ({
                    field: err.path.join("."),
                    message: err.message
                }))
            });
            return;
        }
        // Extraer IDs directamente, ya vienen sin nestear.
        const { vehicle_model_id, person_id, ...vehicleData } = validationResult.data;
        const mileageHistoryData = req.body.mileageHistory;
        // Verificar si el modelo existe usando el ID directo
        const model = await modelRepository.findOneBy({ vehicle_model_id });
        if (!model) {
            res.status(404).json({ message: "El modelo especificado no existe." });
            return;
        }
        // Verificar si el dueño existe usando el ID directo; extraer ID si es objeto
        const ownerId = typeof person_id === 'object' && person_id !== null ? person_id : person_id;
        const owner = await ownerRepository.findOneBy({ person_id: ownerId });
        if (!owner) {
            res.status(404).json({ message: "El propietario especificado no existe." });
            return;
        }
        // ...existing validation for mileageHistoryData...
        if (!mileageHistoryData || !Array.isArray(mileageHistoryData) || mileageHistoryData.length === 0) {
            res.status(400).json({ message: "Se requiere al menos un registro de kilometraje inicial." });
            return;
        }
        const mileageRecords: DeepPartial<MileageHistory>[] = mileageHistoryData.map(record => ({
            ...record
        }));
        const vehicle = vehicleRepository.create({
            ...vehicleData,
            model,
            owner,
            mileage_history: mileageRecords
        });
        await vehicleRepository.save(vehicle);
        res.status(201).json({ message: "Vehículo creado exitosamente", vehicle });
    } catch (error) {
        if (error instanceof QueryFailedError) {
            if ((error as any).code === "23505") {
                res.status(409).json({
                    message: `El vehículo con patente '${req.body.license_plate}' ya está registrado.`,
                    error: (error as any).detail
                });
                return;
            }
        }
        console.error("Error al crear vehículo:", error);
        res.status(500).json({ 
            message: "Error interno al crear vehículo",
            error: error instanceof Error ? error.message : error
        });
    }
};


export const updateVehicle = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        // Cargar el vehículo junto con su historial de kilometraje
        const vehicle = await vehicleRepository.findOne({
            where: { vehicle_id: parseInt(id) },
            relations: ["mileage_history"]
        });
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
        
        const updateData = validationResult.data;
        const mileageHistory = req.body.mileageHistory;
        
        // Actualizar los campos del vehículo
        vehicleRepository.merge(vehicle, updateData);

        // Si se proporcionó un historial de kilometraje, agregar los nuevos registros
        if (mileageHistory && Array.isArray(mileageHistory) && mileageHistory.length > 0) {
            const newMileageRecords = mileageHistory.map((record: any) => ({
                ...record
            }));
            vehicle.mileage_history = [...(vehicle.mileage_history || []), ...newMileageRecords];
        }
        
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
