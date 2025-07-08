import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/ormconfig";
import {  TipoGasto } from "../entities/tipoGasto";
import { GastoEmpresa } from "../entities/gastosEmpresas";
import { GastoSchema, UpdateGastoSchema } from "../schema/work/gastoValidator";
import { DeepPartial } from "typeorm";

const gastoRepository = AppDataSource.getRepository(GastoEmpresa);
const tipoGastoRepository = AppDataSource.getRepository(TipoGasto);

export const getAllGastos = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const gastos = await gastoRepository.find({ 
            relations: ["tipo_gasto"] 
        });
        res.json(gastos);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los gastos", error });
    }
};

export const getGastoById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const gasto = await gastoRepository.findOne({
            where: { id_gasto_empresa: id },
            relations: ["tipo_gasto"]
        });
        
        if (!gasto) {
            res.status(404).json({ message: "Gasto no encontrado" });
            return;
        }

        res.json(gasto);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el gasto", error });
    }
};

export const createGasto = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = GastoSchema.safeParse(req.body);
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

        const { id_tipo_gasto, ...rest } = validationResult.data;
        
        // Verificar que el tipo de gasto exista
        const tipoGasto = await tipoGastoRepository.findOneBy({ id_tipo_gasto });
        if (!tipoGasto) {
            res.status(404).json({ message: "Tipo de gasto no encontrado" });
            return;
        }

        const newGasto = gastoRepository.create({
            ...rest,
            tipo_gasto: tipoGasto
        } as DeepPartial<GastoEmpresa>);
        
        await gastoRepository.save(newGasto);
        
        res.status(201).json({ message: "Gasto creado exitosamente", gasto: newGasto });
    } catch (error) {
        res.status(500).json({ message: "Error al crear el gasto", error });
    }
};

export const updateGasto = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const gasto = await gastoRepository.findOne({
            where: { id_gasto_empresa: id },
            relations: ["tipo_gasto"]
        });
        
        if (!gasto) {
            res.status(404).json({ message: "Gasto no encontrado" });
            return;
        }

        const validationResult = UpdateGastoSchema.safeParse(req.body);
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

        const { id_tipo_gasto, ...rest } = validationResult.data;

        // Si se proporciona un tipo de gasto, verificar que exista
        if (id_tipo_gasto !== undefined) {
            const tipoGasto = await tipoGastoRepository.findOneBy({ id_tipo_gasto });
            if (!tipoGasto) {
                res.status(404).json({ message: "Tipo de gasto no encontrado" });
                return;
            }
            gasto.tipo_gasto = tipoGasto;
        }

        gastoRepository.merge(gasto, rest);
        await gastoRepository.save(gasto);
        
        res.json({ message: "Gasto actualizado exitosamente", gasto });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el gasto", error });
    }
};

export const deleteGasto = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const result = await gastoRepository.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: "Gasto no encontrado" });
            return;
        }

        res.json({ message: "Gasto eliminado exitosamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el gasto", error });
    }
};