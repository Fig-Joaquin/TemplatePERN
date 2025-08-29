import { Request, Response, NextFunction } from "express";
import { mileageHistoryRepository } from "../../repositories/mileageHistoryRepository";
import { formatDate } from "../../utils/dateUtils";
import { handleError } from "../../utils/errorHandler";
import { AppDataSource } from "../../config/ormconfig";
import { Vehicle } from "../../entities";
import { MileageHistorySchema, updateMileageHistorySchema } from "../../schema/vehicles/mileageHistoryValidator";

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

        const { vehicle: vehicle_id, current_mileage } = validationResult.data;

        const vehicle = await AppDataSource.getRepository(Vehicle).findOne({ 
            where: { vehicle_id: Number(vehicle_id) },
            relations: ["mileage_history"]
        });
        if (!vehicle) {
            res.status(404).json({ message: `El vehículo con ID '${Number(vehicle_id)}' no existe.` });
            return;
        }

        // Validar que el nuevo kilometraje sea mayor o igual al último registrado
        if (vehicle.mileage_history && vehicle.mileage_history.length > 0) {
            // Ordenar por fecha de registro descendente para obtener el más reciente
            const sortedHistory = [...vehicle.mileage_history].sort((a, b) => 
                new Date(b.registration_date).getTime() - new Date(a.registration_date).getTime()
            );
            
            const lastMileage = sortedHistory[0].current_mileage;
            
            if (current_mileage < lastMileage) {
                res.status(400).json({ 
                    message: `El nuevo kilometraje (${current_mileage} km) debe ser mayor o igual al último registrado (${lastMileage} km).` 
                });
                return;
            }
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

        const history = await mileageHistoryRepository.findOne({
            where: { mileage_history_id: id },
            relations: ["vehicle", "vehicle.mileage_history"]
        });
        if (!history) {
            res.status(404).json({ message: "Historial de kilometraje no encontrado" });
            return;
        }

        const validationResult = updateMileageHistorySchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ errors: validationResult.error.errors });
            return;
        }

        // Si se está actualizando el kilometraje, validar que sea mayor al anterior
        if (validationResult.data.current_mileage !== undefined) {
            const newMileage = validationResult.data.current_mileage;
            
            // Obtener todos los registros del vehículo excluyendo el actual
            const otherRecords = history.vehicle.mileage_history.filter(
                record => record.mileage_history_id !== id
            );
            
            if (otherRecords.length > 0) {
                // Ordenar por fecha de registro descendente para obtener el más reciente
                const sortedHistory = [...otherRecords].sort((a, b) => 
                    new Date(b.registration_date).getTime() - new Date(a.registration_date).getTime()
                );
                
                const lastMileage = sortedHistory[0].current_mileage;
                
                if (newMileage < lastMileage) {
                    res.status(400).json({ 
                        message: `El kilometraje actualizado (${newMileage} km) debe ser mayor o igual al último registrado (${lastMileage} km).` 
                    });
                    return;
                }
            }
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
