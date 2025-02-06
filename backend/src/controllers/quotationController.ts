import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/ormconfig";
import { Quotation } from "../entities/quotationEntity";
import { QuotationSchema } from "../schema/quotationValidator";

const quotationRepository = AppDataSource.getRepository(Quotation);

export const getAllQuotations = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const quotations = await quotationRepository.find({
            relations: ["vehicle", "mileage_history"]
        });
        res.json(quotations);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener las cotizaciones", error });
    }
};

export const getQuotationById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const quotation = await quotationRepository.findOne({
            where: { quotation_id: id },
            relations: ["vehicle", "mileage_history"]
        });
        if (!quotation) {
            res.status(404).json({ message: "Cotización no encontrada" });
            return;
        }
        res.json(quotation);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener la cotización", error });
    }
};

export const createQuotation = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = QuotationSchema.safeParse(req.body);
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
        const data = validationResult.data;
        const newQuotation = quotationRepository.create(data);
        await quotationRepository.save(newQuotation);
        res.status(201).json({ message: "Cotización creada exitosamente", quotation: newQuotation });
    } catch (error) {
        res.status(500).json({ message: "Error al crear la cotización", error });
    }
};

export const updateQuotation = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }
        const quotation = await quotationRepository.findOneBy({ quotation_id: id });
        if (!quotation) {
            res.status(404).json({ message: "Cotización no encontrada" });
            return;
        }
        // Permitir actualizaciones parciales
        const updateSchema = QuotationSchema.partial();
        const validationResult = updateSchema.safeParse(req.body);
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
        quotationRepository.merge(quotation, validationResult.data);
        await quotationRepository.save(quotation);
        res.json({ message: "Cotización actualizada exitosamente", quotation });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar la cotización", error });
    }
};

export const deleteQuotation = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }
        const result = await quotationRepository.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: "Cotización no encontrada" });
            return;
        }
        res.json({ message: "Cotización eliminada exitosamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar la cotización", error });
    }
};