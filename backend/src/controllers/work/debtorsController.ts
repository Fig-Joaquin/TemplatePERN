import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { Debtor } from "../../entities";
import { DebtorSchema } from "../../schema/work/debtorsValidator";
import { WorkOrder } from "../../entities/work/workOrderEntity"; // <-- nueva importación

const debtorRepository = AppDataSource.getRepository(Debtor);
const workOrderRepository = AppDataSource.getRepository(WorkOrder); // <-- nuevo repositorio

export const getAllDebtors = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const debtors = await debtorRepository.find({
            relations: ["workOrder"]
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
            relations: ["workOrder"]
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
        const newDebtor = debtorRepository.create({
            ...debtorData,
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