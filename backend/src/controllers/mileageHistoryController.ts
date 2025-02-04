// src/controllers/mileageHistoryController.ts
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/ormconfig";
import { MileageHistory } from "../entities/mileageHistoryEntity";
import { MileageHistorySchema, updateMileageHistorySchema } from "../schema/mileageHistoryValidator";

const mileageHistoryRepository = AppDataSource.getRepository(MileageHistory);

export const getAllMileageHistories = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const histories = await mileageHistoryRepository.find({
            relations: ["vehicle"]
        });
        res.json(histories);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener historiales de kilometraje", error });
    }
};

export const getMileageHistoryById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const history = await mileageHistoryRepository.findOne({
            where: { mileage_history_id: parseInt(id) },
            relations: ["vehicle"]
        });
        if (!history) {
            res.status(404).json({ message: "Historial de kilometraje no encontrado" });
            return;
        }
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el historial de kilometraje", error });
    }
};

export const createMileageHistory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = MileageHistorySchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ errors: validationResult.error.errors });
            return;
        }
        const newHistory = mileageHistoryRepository.create(validationResult.data);
        await mileageHistoryRepository.save(newHistory);
        res.status(201).json(newHistory);
    } catch (error) {
        res.status(500).json({ message: "Error al crear historial de kilometraje", error });
    }
};

export const updateMileageHistory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const history = await mileageHistoryRepository.findOneBy({ mileage_history_id: parseInt(id) });
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
        res.status(500).json({ message: "Error al actualizar historial de kilometraje", error });
    }
};

export const deleteMileageHistory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await mileageHistoryRepository.delete(parseInt(id));
        if (result.affected === 0) {
            res.status(404).json({ message: "Historial de kilometraje no encontrado" });
            return;
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar historial de kilometraje", error });
    }
};