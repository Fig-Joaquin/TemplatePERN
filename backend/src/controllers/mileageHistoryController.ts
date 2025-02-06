import { Request, Response, NextFunction } from "express";
import { mileageHistoryRepository } from "../repositories/mileageHistoryRepository";
import { formatDate } from "../utils/dateUtils";
import { handleError } from "../utils/errorHandler";
import { MileageHistorySchema, updateMileageHistorySchema } from "../schema/mileageHistoryValidator";
import { AppDataSource } from "../config/ormconfig";
import { Vehicle } from "../entities/vehicleEntity";

export const getAllMileageHistories = async (_req: Request, res: Response): Promise<void> => {
    try {
        const histories = await mileageHistoryRepository.find({ relations: ["vehicle"] });

        res.json(histories.map(history => ({
            ...history,
            registration_date: formatDate(history.registration_date)
        })));
    } catch (error) {
        handleError(res, "Error al obtener historiales de kilometraje", error);
    }
};

export const getMileageHistoryById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: "El ID debe ser un número válido" });
            return;
        }

        const history = await mileageHistoryRepository.findOne({
            where: { mileage_history_id: id },
            relations: ["vehicle"]
        });

        if (!history) {
            res.status(404).json({ message: "Historial de kilometraje no encontrado" });
            return;
        }

        res.json({
            ...history,
            registration_date: formatDate(history.registration_date)
        });
    } catch (error) {
        handleError(res, "Error al obtener el historial de kilometraje", error);
    }
};

export const createMileageHistory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = MileageHistorySchema.safeParse(req.body);
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

        const { vehicle: vehicle_id, current_mileage } = validationResult.data; // Eliminamos registration_date

        const vehicle = await AppDataSource.getRepository(Vehicle).findOne({ where: { vehicle_id: Number(vehicle_id) } });
        if (!vehicle) {
            res.status(404).json({ message: `El vehículo con ID '${vehicle_id}' no existe.` });
            return;
        }

        const newHistory = mileageHistoryRepository.create({
            vehicle,
            current_mileage
        });

        await mileageHistoryRepository.save(newHistory);
        res.status(201).json({ message: "Historial de kilometraje creado exitosamente", newHistory });
    } catch (error) {
        handleError(res, "Error interno al crear historial de kilometraje", error);
    }
};


export const updateMileageHistory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: "El ID debe ser un número válido" });
            return;
        }

        const history = await mileageHistoryRepository.findOneBy({ mileage_history_id: id });
        if (!history) {
            res.status(404).json({ message: "Historial de kilometraje no encontrado" });
            return;
        }

        const validationResult = updateMileageHistorySchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ errors: validationResult.error.errors });
            return;
        }

        mileageHistoryRepository.merge(history, validationResult.data);
        await mileageHistoryRepository.save(history);
        res.json(history);
    } catch (error) {
        handleError(res, "Error al actualizar historial de kilometraje", error);
    }
};

export const deleteMileageHistory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: "El ID debe ser un número válido" });
            return;
        }

        const result = await mileageHistoryRepository.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: "Historial de kilometraje no encontrado" });
            return;
        }

        res.status(200).json({ message: "Historial de kilometraje eliminado exitosamente" });
    } catch (error) {
        handleError(res, "Error al eliminar historial de kilometraje", error);
    }
};
