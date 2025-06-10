/* eslint-disable no-console */
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { WorkOrderSchema } from "../../schema/work/workOrderValidator";
import { DeepPartial } from "typeorm";
import { WorkOrder, Vehicle, Quotation, Notification, WorkProductDetail, WorkOrderTechnician } from "../../entities";

const workOrderRepository = AppDataSource.getRepository(WorkOrder);
const vehicleRepository = AppDataSource.getRepository(Vehicle);
const quotationRepository = AppDataSource.getRepository(Quotation);
const notifRepo = AppDataSource.getRepository(Notification);
// Se importa el repositorio de detalles de producto para actualizar los registros existentes.
const workProductDetailRepository = AppDataSource.getRepository(WorkProductDetail);
const workOrderTechnicianRepository = AppDataSource.getRepository(WorkOrderTechnician);


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
              "productDetails.tax",          // Impuesto asociado al detalle
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
                "productDetails.tax",          // Impuesto asociado al detalle
                "technicians"                 
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
  
      // Crear la orden de trabajo con estado predeterminado "not_started"
      const newWorkOrder = workOrderRepository.create({
        ...rest,
        vehicle,
        quotation,
        order_status: "not_started"
      } as DeepPartial<WorkOrder>);
  
      await workOrderRepository.save(newWorkOrder);
  
      // Caso 3: Si la orden se crea a partir de una cotización, actualizar los detalles
      // de producto que tengan ese quotation_id y work_order_id nulo
      if (quotation) {
        await workProductDetailRepository
          .createQueryBuilder()
          .update(WorkProductDetail)
          .set({ work_order: newWorkOrder })
          .where("quotation_id = :quotationId", { quotationId: quotation.quotation_id })
          .andWhere("work_order_id IS NULL")
          .execute();
      }
  
      // Retornar la orden con las relaciones actualizadas (si es necesario, se puede reconsultar)
      const orderWithRelations = await workOrderRepository.findOne({
        where: { work_order_id: newWorkOrder.work_order_id },
        relations: [
          "vehicle",
          "vehicle.model",
          "vehicle.model.brand",
          "vehicle.owner",
          "vehicle.company",
          "quotation",
          "debtors",
          "productDetails",
          "productDetails.product",
          "productDetails.quotation",
          "productDetails.tax",
          "technicians"
        ]
      });
  
      res.status(201).json({ message: "Orden de trabajo creada exitosamente", workOrder: orderWithRelations });
      return;
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({ message: "Error al crear la orden de trabajo", error });
      }
      return;
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
  
      // Si cambia de estado y ya no está "not_started", eliminar su notificación
      if (workOrder.order_status !== "not_started") {
        await notifRepo.delete({ work_order_id: workOrder.work_order_id });
      }
  
      res.json({ message: "Orden de trabajo actualizada exitosamente", workOrder });
    } catch (error) {
      console.error("Error al actualizar la orden de trabajo:", error);
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
  
      console.log("work_order_id:", id);
  
      // 1. Eliminar manualmente los técnicos asociados a la orden
      await workOrderTechnicianRepository
        .createQueryBuilder()
        .delete()
        .from(WorkOrderTechnician)
        .where("work_order_id = :id", { id })
        .execute();
  
      // 2. Para los detalles que provienen de una cotización (quotation_id IS NOT NULL):
      //    desvincular la orden, estableciendo work_order a null
      await workProductDetailRepository
        .createQueryBuilder()
        .update(WorkProductDetail)
        .set({ work_order: null })
        .where("work_order_id = :id", { id })
        .andWhere("quotation_id IS NOT NULL")
        .execute();
  
      // 3. Para los detalles de mantenimiento (quotation_id IS NULL):
      //    eliminarlos manualmente
      await workProductDetailRepository
        .createQueryBuilder()
        .delete()
        .from(WorkProductDetail)
        .where("work_order_id = :id", { id })
        .andWhere("quotation_id IS NULL")
        .execute();
  
      // 4. Finalmente, eliminar la orden de trabajo
      const result = await workOrderRepository.delete(id);
      if (result.affected === 0) {
        res.status(404).json({ message: "Orden de trabajo no encontrada" });
        return;
      }
  
      res.json({ message: "Orden de trabajo eliminada exitosamente" });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error en deleteWorkOrder:", error.stack);
        res.status(500).json({ message: "Error al eliminar la orden de trabajo", error: error.message });
      } else {
        console.error("Error en deleteWorkOrder:", error);
        res.status(500).json({ message: "Error al eliminar la orden de trabajo", error: String(error) });
      }
    }
  };