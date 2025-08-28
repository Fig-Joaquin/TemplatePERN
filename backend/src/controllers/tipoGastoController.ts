import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/ormconfig";
import { ExpenseType } from "../entities/tipoGasto";
import { TipoGastoSchema } from "../schema/work/tipoGastoValidator";

const tipoGastoRepository = AppDataSource.getRepository(ExpenseType);

export const getAllTiposGasto = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const tiposGasto = await tipoGastoRepository.find();
        res.json(tiposGasto);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los tipos de gasto", error });
    }
};

export const getTipoGastoById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const tipoGasto = await tipoGastoRepository.findOneBy({ expense_type_id: id });
        if (!tipoGasto) {
            res.status(404).json({ message: "Tipo de gasto no encontrado" });
            return;
        }

        res.json(tipoGasto);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el tipo de gasto", error });
    }
};

export const createTipoGasto = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = TipoGastoSchema.safeParse(req.body);
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

        const { expense_type_name } = validationResult.data;
        
        // Verificar si ya existe un tipo de gasto con el mismo nombre
        const existingTipoGasto = await tipoGastoRepository.findOneBy({ expense_type_name: expense_type_name });
        if (existingTipoGasto) {
            res.status(409).json({ message: `El tipo de gasto '${expense_type_name}' ya existe.` });
            return;
        }

        const newTipoGasto = tipoGastoRepository.create(validationResult.data);
        await tipoGastoRepository.save(newTipoGasto);
        
        res.status(201).json({ message: "Tipo de gasto creado exitosamente", tipoGasto: newTipoGasto });
    } catch (error) {
        res.status(500).json({ message: "Error al crear el tipo de gasto", error });
    }
};

export const updateTipoGasto = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const tipoGasto = await tipoGastoRepository.findOneBy({ expense_type_id: id });
        if (!tipoGasto) {
            res.status(404).json({ message: "Tipo de gasto no encontrado" });
            return;
        }

        const validationResult = TipoGastoSchema.partial().safeParse(req.body);
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

        // Si se está actualizando el nombre, verificar que no exista otro tipo con ese nombre
        if (validationResult.data.expense_type_name && 
            validationResult.data.expense_type_name !== tipoGasto.expense_type_name) {
            const existingTipoGasto = await tipoGastoRepository.findOneBy({ 
                expense_type_name: validationResult.data.expense_type_name 
            });
            if (existingTipoGasto) {
                res.status(409).json({ 
                    message: `El tipo de gasto '${validationResult.data.expense_type_name}' ya existe.` 
                });
                return;
            }
        }

        tipoGastoRepository.merge(tipoGasto, validationResult.data);
        await tipoGastoRepository.save(tipoGasto);
        
        res.json({ message: "Tipo de gasto actualizado exitosamente", tipoGasto });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el tipo de gasto", error });
    }
};

export const deleteTipoGasto = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        // Verificar si existen gastos asociados a este tipo
        const tipoGasto = await tipoGastoRepository.findOne({
            where: { expense_type_id: id },
            relations: ["gastos"]
        });

        if (!tipoGasto) {
            res.status(404).json({ message: "Tipo de gasto no encontrado" });
            return;
        }

        if (tipoGasto.expenses && tipoGasto.expenses.length > 0) {
            res.status(409).json({ 
                message: "No se puede eliminar este tipo de gasto porque tiene gastos asociados" 
            });
            return;
        }

        const result = await tipoGastoRepository.delete({ expense_type_id: id });
        if (result.affected === 0) {
            res.status(404).json({ message: "Tipo de gasto no encontrado" });
            return;
        }

        res.json({ message: "Tipo de gasto eliminado exitosamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el tipo de gasto", error });
    }
};