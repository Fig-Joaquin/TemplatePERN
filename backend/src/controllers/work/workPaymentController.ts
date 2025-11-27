import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { WorkPayment, PaymentType, WorkOrder } from "../../entities";
import { WorkPaymentSchema } from "../../schema/work/workPaymentValidator";
import { DeepPartial } from "typeorm";

const workPaymentRepository = AppDataSource.getRepository(WorkPayment);
const paymentTypeRepository = AppDataSource.getRepository(PaymentType);
const workOrderRepository = AppDataSource.getRepository(WorkOrder);

export const getAllWorkPayments = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const workPayments = await workPaymentRepository.find({
            relations: [
                "payment_type", 
                "work_order",
                "work_order.vehicle",
                "work_order.vehicle.model",
                "work_order.vehicle.model.brand",
                "work_order.vehicle.owner",
                "work_order.vehicle.company",
                "work_order.technicians",
                "work_order.technicians.technician"
            ]
        });
        res.json(workPayments);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los pagos", error });
    }
};

export const getWorkPaymentById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }
        
        const workPayment = await workPaymentRepository.findOne({
            where: { work_payment_id: id },
            relations: [
                "payment_type", 
                "work_order",
                "work_order.vehicle",
                "work_order.vehicle.model",
                "work_order.vehicle.model.brand",
                "work_order.vehicle.owner",
                "work_order.vehicle.company",
                "work_order.technicians",
                "work_order.technicians.technician"
            ]
        });
        
        if (!workPayment) {
            res.status(404).json({ message: "Pago no encontrado" });
            return;
        }
        
        res.json(workPayment);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el pago", error });
    }
};

export const createWorkPayment = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = WorkPaymentSchema.safeParse(req.body);
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

        const { payment_type_id, work_order_id, ...paymentData } = validationResult.data;
        
        // Verificar que el tipo de pago exista
        const paymentType = await paymentTypeRepository.findOneBy({ payment_type_id });
        if (!paymentType) {
            res.status(404).json({ message: "Tipo de pago no encontrado" });
            return;
        }

        // Verificar que la orden de trabajo exista
        const workOrder = await workOrderRepository.findOneBy({ work_order_id });
        if (!workOrder) {
            res.status(404).json({ message: "Orden de trabajo no encontrada" });
            return;
        }

        // Permitir múltiples pagos por orden de trabajo (pagos parciales)
        // Solo validamos que el monto total pagado no exceda el total de la orden
        const existingPayments = await workPaymentRepository.find({
            where: { work_order: { work_order_id } }
        });
        
        const totalAlreadyPaid = existingPayments
            .filter(p => p.payment_status !== "cancelado")
            .reduce((sum, p) => sum + Number(p.amount_paid), 0);
        
        const orderTotal = Number(workOrder.total_amount);
        const newPaymentAmount = Number(paymentData.amount_paid);
        
        if (totalAlreadyPaid + newPaymentAmount > orderTotal) {
            res.status(400).json({ 
                message: `El monto excede el total pendiente. Total orden: ${orderTotal}, Ya pagado: ${totalAlreadyPaid}, Disponible: ${orderTotal - totalAlreadyPaid}`,
                total_order: orderTotal,
                already_paid: totalAlreadyPaid,
                available: orderTotal - totalAlreadyPaid
            });
            return;
        }

        const newWorkPayment = workPaymentRepository.create({
            ...paymentData,
            payment_type: paymentType,
            work_order: workOrder
        } as DeepPartial<WorkPayment>);
        
        await workPaymentRepository.save(newWorkPayment);
        
        res.status(201).json({ message: "Pago creado exitosamente", workPayment: newWorkPayment });
    } catch (error) {
        res.status(500).json({ message: "Error al crear el pago", error });
    }
};

export const updateWorkPayment = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }
        
        const workPayment = await workPaymentRepository.findOne({
            where: { work_payment_id: id },
            relations: ["payment_type", "work_order"]
        });
        
        if (!workPayment) {
            res.status(404).json({ message: "Pago no encontrado" });
            return;
        }

        const validationResult = WorkPaymentSchema.partial().safeParse(req.body);
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

        const { payment_type_id, work_order_id, ...paymentData } = validationResult.data;
        
        // Actualizar la entidad con los datos básicos
        workPaymentRepository.merge(workPayment, paymentData);
        
        // Actualizar relación con tipo de pago si se proporciona
        if (payment_type_id !== undefined) {
            const paymentType = await paymentTypeRepository.findOneBy({ payment_type_id });
            if (!paymentType) {
                res.status(404).json({ message: "Tipo de pago no encontrado" });
                return;
            }
            workPayment.payment_type = paymentType;
        }
        
        // Actualizar relación con orden de trabajo si se proporciona
        if (work_order_id !== undefined) {
            const workOrder = await workOrderRepository.findOneBy({ work_order_id });
            if (!workOrder) {
                res.status(404).json({ message: "Orden de trabajo no encontrada" });
                return;
            }
            workPayment.work_order = workOrder;
        }
        
        await workPaymentRepository.save(workPayment);
        
        res.json({ message: "Pago actualizado exitosamente", workPayment });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el pago", error });
    }
};

export const deleteWorkPayment = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const result = await workPaymentRepository.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: "Pago no encontrado" });
            return;
        }

        res.json({ message: "Pago eliminado exitosamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el pago", error });
    }
};