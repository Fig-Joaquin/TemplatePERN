import { Request, Response, NextFunction } from "express";
import { Tax } from "../../entities";
import { AppDataSource } from "../../config/ormconfig";
import { TaxSchema } from "../../schema/work/taxValidator";

const taxRepository = AppDataSource.getRepository(Tax);

export const getAllTaxes = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const taxes = await taxRepository.find();
        res.json(taxes);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener impuestos", error });
    }
};

export const getTaxById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: "El ID debe ser un número válido" });
            return;
        }

        const tax = await taxRepository.findOneBy({ tax_id: id });
        if (!tax) {
            res.status(404).json({ message: "Impuesto no encontrado" });
            return;
        }

        res.json(tax);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el impuesto", error });
    }
};

export const createTax = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = TaxSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: "Error de validación",
                errors: validationResult.error.errors
            });
            return;
        }

        const newTax = taxRepository.create(validationResult.data);
        await taxRepository.save(newTax);
        res.status(201).json(newTax);
    } catch (error) {
        res.status(500).json({ message: "Error al crear el impuesto", error });
    }
};

export const updateTax = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: "El ID debe ser un número válido" });
            return;
        }

        const tax = await taxRepository.findOneBy({ tax_id: id });
        if (!tax) {
            res.status(404).json({ message: "Impuesto no encontrado" });
            return;
        }

        const validationResult = TaxSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: "Error de validación",
                errors: validationResult.error.errors
            });
            return;
        }

        taxRepository.merge(tax, validationResult.data);
        await taxRepository.save(tax);
        res.json(tax);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el impuesto", error });
    }
};

export const deleteTax = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (Number.isNaN(id)) {
            res.status(400).json({ message: "El ID debe ser un número válido" });
            return;
        }

        const result = await taxRepository.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: "Impuesto no encontrado" });
            return;
        }

        res.status(200).json({ message: "Impuesto eliminado exitosamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el impuesto", error });
    }
};