import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/ormconfig";
import { Debtor } from "../entities/debtorsEntity";
import { DebtorSchema } from "../schema/debtorsValidator";

const debtorRepository = AppDataSource.getRepository(Debtor);

export const getAllDebtors = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const debtors = await debtorRepository.find({
            relations: ["workOrder"]
        });
        res.json(debtors);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los deudores", error });
    }
};

export const getDebtorById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const debtor = await debtorRepository.findOne({
            where: { debtor_id: id },
            relations: ["workOrder"]
        });

        if (!debtor) {
            res.status(404).json({ message: "Deudor no encontrado" });
            return;
        }

        res.json(debtor);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el deudor", error });
    }
};

export const createDebtor = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = DebtorSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: "Error de validación",
                errors: validationResult.error.errors
            });
            return;
        }

        const newDebtor = debtorRepository.create(validationResult.data);
        await debtorRepository.save(newDebtor);
        res.status(201).json(newDebtor);
    } catch (error) {
        res.status(500).json({ message: "Error al crear el deudor", error });
    }
};

export const updateDebtor = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const validationResult = DebtorSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: "Error de validación",
                errors: validationResult.error.errors
            });
            return;
        }

        const debtor = await debtorRepository.findOneBy({ debtor_id: id });
        if (!debtor) {
            res.status(404).json({ message: "Deudor no encontrado" });
            return;
        }

        debtorRepository.merge(debtor, validationResult.data);
        await debtorRepository.save(debtor);
        res.json(debtor);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el deudor", error });
    }
};

export const deleteDebtor = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const result = await debtorRepository.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: "Deudor no encontrado" });
            return;
        }

        res.status(200).json({ message: "Deudor eliminado exitosamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el deudor", error });
    }
};