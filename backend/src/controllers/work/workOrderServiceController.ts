/* eslint-disable no-console */
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { WorkOrderService, WorkOrder, Service } from "../../entities";
import {
    workOrderServiceSchema,
    updateWorkOrderServiceSchema,
} from "../../schema/work/workOrderServiceValidator";

const workOrderServiceRepository = AppDataSource.getRepository(WorkOrderService);
const workOrderRepository = AppDataSource.getRepository(WorkOrder);
const serviceRepository = AppDataSource.getRepository(Service);

// POST /workOrders/:id/services
export const addServiceToWorkOrder = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const workOrderId = parseInt(req.params.id);
        if (isNaN(workOrderId)) {
            res.status(400).json({ message: "ID de orden de trabajo inválido" });
            return;
        }

        const validationResult = workOrderServiceSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: "Error de validación",
                errors: validationResult.error.errors.map(err => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
            return;
        }

        const { service_id, cantidad, precio_unitario } = validationResult.data;

        const workOrder = await workOrderRepository.findOneBy({ work_order_id: workOrderId });
        if (!workOrder) {
            res.status(404).json({ message: "Orden de trabajo no encontrada" });
            return;
        }

        const service = await serviceRepository.findOneBy({ service_id, is_active: true });
        if (!service) {
            res.status(404).json({ message: "Servicio no encontrado o inactivo" });
            return;
        }

        const subtotal = cantidad * precio_unitario;

        const newDetail = workOrderServiceRepository.create({
            work_order: workOrder,
            service,
            cantidad,
            precio_unitario,
            subtotal,
        });

        await workOrderServiceRepository.save(newDetail);

        res.status(201).json({
            message: "Servicio agregado a la orden de trabajo exitosamente",
            workOrderService: {
                ...newDetail,
                service,
            },
        });
    } catch (error) {
        console.error("Error al agregar servicio a orden de trabajo:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// GET /workOrders/:id/services
export const getServicesByWorkOrder = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const workOrderId = parseInt(req.params.id);
        if (isNaN(workOrderId)) {
            res.status(400).json({ message: "ID de orden de trabajo inválido" });
            return;
        }

        const workOrder = await workOrderRepository.findOneBy({ work_order_id: workOrderId });
        if (!workOrder) {
            res.status(404).json({ message: "Orden de trabajo no encontrada" });
            return;
        }

        const details = await workOrderServiceRepository.find({
            where: { work_order: { work_order_id: workOrderId } },
            relations: ["service"],
        });

        res.json(details);
    } catch (error) {
        console.error("Error al obtener servicios de orden de trabajo:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// PUT /work-order-services/:id
export const updateWorkOrderService = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const detail = await workOrderServiceRepository.findOne({
            where: { id },
            relations: ["service"],
        });
        if (!detail) {
            res.status(404).json({ message: "Detalle de servicio no encontrado" });
            return;
        }

        const validationResult = updateWorkOrderServiceSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: "Error de validación",
                errors: validationResult.error.errors.map(err => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
            return;
        }

        const { cantidad, precio_unitario } = validationResult.data;

        const newCantidad = cantidad ?? detail.cantidad;
        const newPrecioUnitario = precio_unitario ?? Number(detail.precio_unitario);
        const newSubtotal = newCantidad * newPrecioUnitario;

        await workOrderServiceRepository.update(id, {
            cantidad: newCantidad,
            precio_unitario: newPrecioUnitario,
            subtotal: newSubtotal,
        });

        const updated = await workOrderServiceRepository.findOne({
            where: { id },
            relations: ["service"],
        });

        res.json({
            message: "Detalle de servicio actualizado exitosamente",
            workOrderService: updated,
        });
    } catch (error) {
        console.error("Error al actualizar detalle de servicio en orden de trabajo:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// DELETE /work-order-services/:id
export const deleteWorkOrderService = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const detail = await workOrderServiceRepository.findOneBy({ id });
        if (!detail) {
            res.status(404).json({ message: "Detalle de servicio no encontrado" });
            return;
        }

        await workOrderServiceRepository.delete(id);

        res.json({ message: "Detalle de servicio eliminado exitosamente" });
    } catch (error) {
        console.error("Error al eliminar detalle de servicio en orden de trabajo:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};
