import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { WorkOrderSchema } from "../../schema/workOrderValidator";
import { DeepPartial } from "typeorm";
import { WorkOrder, Vehicle, Person, Quotation} from "../../entities";


const workOrderRepository = AppDataSource.getRepository(WorkOrder);
const vehicleRepository = AppDataSource.getRepository(Vehicle);  // nuevo repository
const personRepository = AppDataSource.getRepository(Person);    // nuevo repository
const quotationRepository = AppDataSource.getRepository(Quotation); // nuevo repository

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

        // Extraer IDs y datos restantes
        const { vehicle_id, person_id, quotation_id, ...rest } = validationResult.data as any;
        
        // Verificar existencia de vehicle
        const vehicle = await vehicleRepository.findOneBy({ vehicle_id: parseInt(vehicle_id) });
        if (!vehicle) {
            res.status(400).json({ message: "El vehículo no existe" });
            return;
        }

        // Verificar existencia de person
        const person = await personRepository.findOneBy({ person_id: parseInt(person_id) });
        if (!person) {
            res.status(400).json({ message: "La persona no existe" });
            return;
        }

        // Verificar existencia de quotation
        const quotation = await quotationRepository.findOneBy({ quotation_id: parseInt(quotation_id) });
        if (!quotation) {
            res.status(400).json({ message: "La cotización no existe" });
            return;
        }
      
        const newWorkOrder = workOrderRepository.create({ 
            ...rest,
            vehicle,
            person,
            quotation
        } as DeepPartial<WorkOrder>);
      
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

        workOrderRepository.merge(workOrder, validationResult.data as DeepPartial<WorkOrder>);
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