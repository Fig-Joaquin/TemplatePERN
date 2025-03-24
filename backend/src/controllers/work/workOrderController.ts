import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { WorkOrderSchema } from "../../schema/work/workOrderValidator";
import { DeepPartial } from "typeorm";
import { WorkOrder, Vehicle, Quotation } from "../../entities";

const workOrderRepository = AppDataSource.getRepository(WorkOrder);
const vehicleRepository = AppDataSource.getRepository(Vehicle);
const quotationRepository = AppDataSource.getRepository(Quotation);

export const getAllWorkOrders = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const workOrders = await workOrderRepository.find({
            relations: [
              "vehicle",
              "vehicle.model",
              "vehicle.model.brand",
              "vehicle.owner",
              "vehicle.company",
              "quotation",
              "debtors",
              "productDetails",              // Detalles de productos asociados a la orden
              "productDetails.product",      // Producto de cada detalle
              "productDetails.quotation",    // Cotización asociada al detalle (si existe)
              "productDetails.tax",       // Impuesto asociado al detalle
              "technicians"              
            ]
          });
      res.json(workOrders);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener las órdenes de trabajo", error });
    }
  };
export const getWorkOrderById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const workOrder = await workOrderRepository.findOne({
            where: { work_order_id: id },
            relations: [
                "vehicle",
                "vehicle.model",
                "vehicle.model.brand",
                "vehicle.owner",
                "vehicle.company",
                "quotation",
                "debtors",
                "productDetails",              // Detalles de productos asociados a la orden
                "productDetails.product",      // Producto de cada detalle
                "productDetails.quotation",    // Cotización asociada al detalle (si existe)
                "productDetails.tax",       // Impuesto asociado al detalle
                "technicians"                 // Detalles de productos asociados a la orden
            ]
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

        const { vehicle_id, quotation_id, ...rest } = validationResult.data;

        // Verificar la existencia del vehículo
        const vehicle = await vehicleRepository.findOneBy({ vehicle_id });
        if (!vehicle) {
            res.status(400).json({ message: "El vehículo no existe" });
            return;
        }

        // Verificar la existencia de la cotización si se proporciona
        let quotation: Quotation | null = null;
        if (quotation_id) {
            quotation = await quotationRepository.findOneBy({ quotation_id });
            if (!quotation) {
                res.status(400).json({ message: "La cotización no existe" });
                return;
            }
        }

        // Crear la orden de trabajo con estado predeterminado "pending"
        const newWorkOrder = workOrderRepository.create({
            ...rest,
            vehicle,
            quotation,
            order_status: "not_started" // Se establece automáticamente
        } as DeepPartial<WorkOrder>);

        await workOrderRepository.save(newWorkOrder);
        res.status(201).json({ message: "Orden de trabajo creada exitosamente", workOrder: newWorkOrder });
    } catch (error) {
        res.status(500).json({ message: "Error al crear la orden de trabajo", error });
    }
};

export const updateWorkOrder = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = Number(req.params.id);
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

        workOrderRepository.merge(workOrder, validationResult.data as DeepPartial<WorkOrder>);
        await workOrderRepository.save(workOrder);
        res.json({ message: "Orden de trabajo actualizada exitosamente", workOrder });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar la orden de trabajo", error });
    }
};

export const deleteWorkOrder = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = Number(req.params.id);
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

