import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { Debtor, WorkPayment, PaymentType } from "../../entities";
import { DebtorSchema } from "../../schema/work/debtorsValidator";
import { WorkOrder } from "../../entities/work/workOrderEntity";

const debtorRepository = AppDataSource.getRepository(Debtor);
const workOrderRepository = AppDataSource.getRepository(WorkOrder);
const workPaymentRepository = AppDataSource.getRepository(WorkPayment);
const paymentTypeRepository = AppDataSource.getRepository(PaymentType);

export const getAllDebtors = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const debtors = await debtorRepository.find({
            relations: [
                "workOrder",
                "workOrder.vehicle",
                "workOrder.vehicle.owner",
                "workOrder.vehicle.company",
                "workOrder.vehicle.model",
                "workOrder.vehicle.model.brand",
                "workOrder.vehicle.mileage_history"
            ]
        });
        res.json(debtors);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los deudores", error });
    }
};

export const getDebtorById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const debtor = await debtorRepository.findOne({
            where: { debtor_id: id },
            relations: [
                "workOrder",
                "workOrder.vehicle",
                "workOrder.vehicle.owner",
                "workOrder.vehicle.company",
                "workOrder.vehicle.model",
                "workOrder.vehicle.model.brand",
                "workOrder.vehicle.mileage_history"
            ]
        });

        if (!debtor) {
            res.status(404).json({ message: "Deudor no encontrado" });
            return;
        }

        res.json(debtor);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el deudor", error });
    }
};

export const createDebtor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const validationResult = DebtorSchema.safeParse(req.body);
    if (!validationResult.success) {
        return next({
            status: 400,
            message: "Error de validación",
            errors: validationResult.error.errors
        });
    }
    try {
        // Extraer work_order_id sin buscar el objeto workOrder
        const { work_order_id, ...debtorData } = validationResult.data;
        // Verificar que el work_order_id exista en el repositorio de WorkOrder
        const workOrder = await workOrderRepository.findOneBy({ work_order_id });
        if (!workOrder) {
            return next({ status: 404, message: "Orden de trabajo no encontrada" });
        }
        
        // Si no se especifica total_amount, usar el total de la orden de trabajo
        const finalDebtorData = {
            ...debtorData,
            total_amount: debtorData.total_amount || workOrder.total_amount
        };
        
        const newDebtor = debtorRepository.create({
            ...finalDebtorData,
            workOrder: workOrder  // Se utiliza el objeto de orden de trabajo
        });
        await debtorRepository.save(newDebtor);
        res.status(201).json({ data: newDebtor });
    } catch (error) {
        next(error);
    }
};

export const updateDebtor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return next({ status: 400, message: "ID inválido" });
    }
    const validationResult = DebtorSchema.safeParse(req.body);
    if (!validationResult.success) {
        return next({
            status: 400,
            message: "Error de validación",
            errors: validationResult.error.errors
        });
    }
    try {
        let debtor = await debtorRepository.findOneBy({ debtor_id: id });
        if (!debtor) {
            return next({ status: 404, message: "Deudor no encontrado" });
        }
        // Eliminar work_order_id de los datos a actualizar
        const { work_order_id, ...debtorData } = validationResult.data; // eslint-disable-line @typescript-eslint/no-unused-vars
        debtorRepository.merge(debtor, debtorData);
        debtor = await debtorRepository.save(debtor);
        res.status(200).json({ data: debtor });
    } catch (error) {
        next(error);
    }
};

export const deleteDebtor = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const result = await debtorRepository.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: "Deudor no encontrado" });
            return;
        }

        res.status(200).json({ message: "Deudor eliminado exitosamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el deudor", error });
    }
};

// Obtener deudores por orden de trabajo
export const getDebtorsByWorkOrder = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const work_order_id = parseInt(req.params.work_order_id);
        if (isNaN(work_order_id)) {
            res.status(400).json({ message: "ID de orden de trabajo inválido" });
            return;
        }

        const debtors = await debtorRepository.find({
            where: { workOrder: { work_order_id } },
            relations: [
                "workOrder", 
                "workOrder.vehicle", 
                "workOrder.vehicle.owner",
                "workOrder.vehicle.company"
            ],
            order: { created_at: "DESC" }
        });

        res.json(debtors);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los deudores de la orden de trabajo", error });
    }
};

// Procesar pago de deuda
export const processPayment = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const { payment_amount, payment_type_id } = req.body;
        
        if (!payment_amount || payment_amount <= 0) {
            res.status(400).json({ message: "Monto de pago inválido" });
            return;
        }

        const debtor = await debtorRepository.findOne({
            where: { debtor_id: id },
            relations: [
                "workOrder",
                "workOrder.vehicle",
                "workOrder.vehicle.owner",
                "workOrder.vehicle.company"
            ]
        });

        if (!debtor) {
            res.status(404).json({ message: "Deudor no encontrado" });
            return;
        }

        const currentPaid = Number(debtor.paid_amount) || 0;
        const totalAmount = Number(debtor.total_amount) || 0;
        const newPaidAmount = currentPaid + Number(payment_amount);

        // Validar que no se pague más del total
        if (totalAmount > 0 && newPaidAmount > totalAmount) {
            res.status(400).json({ 
                message: "El monto del pago excede la deuda restante",
                remaining: totalAmount - currentPaid
            });
            return;
        }

        // Determinar el nuevo estado
        let newStatus = "pending";
        if (totalAmount > 0) {
            if (newPaidAmount >= totalAmount) {
                newStatus = "paid";
            } else if (newPaidAmount > 0) {
                newStatus = "partial";
            }
        } else {
            // Si no hay monto total definido, considerar como pago parcial
            newStatus = newPaidAmount > 0 ? "partial" : "pending";
        }

        // Buscar o crear un tipo de pago por defecto para deudores
        let paymentType = await paymentTypeRepository.findOneBy({ type_name: "Pago de Deuda" });
        if (!paymentType) {
            // Crear tipo de pago por defecto si no existe
            paymentType = paymentTypeRepository.create({ type_name: "Pago de Deuda" });
            await paymentTypeRepository.save(paymentType);
        }

        // Si se especifica un payment_type_id, usarlo
        if (payment_type_id) {
            const specifiedPaymentType = await paymentTypeRepository.findOneBy({ payment_type_id });
            if (specifiedPaymentType) {
                paymentType = specifiedPaymentType;
            }
        }

        // Crear o actualizar el pago de cliente (WorkPayment)
        let workPayment = await workPaymentRepository.findOne({
            where: { work_order: { work_order_id: debtor.workOrder.work_order_id } }
        });

        if (workPayment) {
            // Actualizar el pago existente sumando el nuevo monto
            const currentAmountPaid = Number(workPayment.amount_paid) || 0;
            workPayment.amount_paid = currentAmountPaid + Number(payment_amount);
            workPayment.payment_status = newStatus;
            workPayment.payment_date = new Date();
            await workPaymentRepository.save(workPayment);
        } else {
            // Crear un nuevo pago de cliente
            workPayment = workPaymentRepository.create({
                payment_type: paymentType,
                work_order: debtor.workOrder,
                payment_status: newStatus,
                amount_paid: Number(payment_amount),
                payment_date: new Date()
            });
            await workPaymentRepository.save(workPayment);
        }

        // Actualizar la deuda
        await debtorRepository.update(id, {
            paid_amount: newPaidAmount,
            payment_status: newStatus
        });

        // Obtener la deuda actualizada
        const updatedDebtor = await debtorRepository.findOne({
            where: { debtor_id: id },
            relations: [
                "workOrder",
                "workOrder.vehicle",
                "workOrder.vehicle.owner",
                "workOrder.vehicle.company"
            ]
        });

        res.status(200).json({
            message: "Pago procesado exitosamente",
            debtor: updatedDebtor,
            work_payment: workPayment,
            payment_details: {
                amount_paid: payment_amount,
                total_paid: newPaidAmount,
                remaining: totalAmount > 0 ? Math.max(0, totalAmount - newPaidAmount) : null,
                percentage_paid: totalAmount > 0 ? Math.round((newPaidAmount / totalAmount) * 100) : null
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error al procesar el pago", error });
    }
};