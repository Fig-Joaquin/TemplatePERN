import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/ormconfig";
import { WorkOrder } from "../entities/workOrderEntity";
import { WorkOrderSchema } from "../schema/workOrderValidator";

const workOrderRepository = AppDataSource.getRepository(WorkOrder);

export const getAllWorkOrders = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const workOrders = await workOrderRepository.find({
            relations: ["vehicle", "quotation", "person"]
        });
        res.json(workOrders);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener las órdenes de trabajo", error });
    }
};

export const getWorkOrderById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const workOrder = await workOrderRepository.findOne({
            where: { work_order_id: id },
            relations: ["vehicle", "quotation", "person"]
        });

        if (!workOrder) {
            res.status(404).json({ message: "Orden de trabajo no encontrada" });
            return;
        }
        res.json(workOrder);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener la orden de trabajo", error });
    }
};

export const createWorkOrder = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = WorkOrderSchema.safeParse(req.body);
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

        const newWorkOrder = workOrderRepository.create(validationResult.data);
        await workOrderRepository.save(newWorkOrder);
        res.status(201).json({ message: "Orden de trabajo creada exitosamente", workOrder: newWorkOrder });
    } catch (error) {
        res.status(500).json({ message: "Error al crear la orden de trabajo", error });
    }
};

export const updateWorkOrder = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const workOrder = await workOrderRepository.findOneBy({ work_order_id: id });
        if (!workOrder) {
            res.status(404).json({ message: "Orden de trabajo no encontrada" });
            return;
        }

        const updateSchema = WorkOrderSchema.partial();
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

        workOrderRepository.merge(workOrder, validationResult.data);
        await workOrderRepository.save(workOrder);
        res.json({ message: "Orden de trabajo actualizada exitosamente", workOrder });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar la orden de trabajo", error });
    }
};

export const deleteWorkOrder = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const result = await workOrderRepository.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: "Orden de trabajo no encontrada" });
            return;
        }
        res.json({ message: "Orden de trabajo eliminada exitosamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar la orden de trabajo", error });
    }
};