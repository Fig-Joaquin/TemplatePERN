import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/ormconfig";
import { WorkProductDetail } from "../entities/workProductDetailEntity";
import { workProductDetailSchema } from "../schema/workProductDetailValidator";
import { WorkOrder } from "../entities/workOrderEntity";

const workProductDetailRepository = AppDataSource.getRepository(WorkProductDetail);

export const getAllWorkProductDetails = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const details = await workProductDetailRepository.find({
            relations: ["work_order", "product", "quotation", "tax"]
        });
        res.json(details);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los detalles del producto de trabajo", error });
    }
};

export const getWorkProductDetailById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }
        const detail = await workProductDetailRepository.findOne({
            where: { work_product_detail_id: id },
            relations: ["work_order", "product", "quotation", "tax"]
        });
        if (!detail) {
            res.status(404).json({ message: "Detalle de producto de trabajo no encontrado" });
            return;
        }
        res.json(detail);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el detalle de producto de trabajo", error });
    }
};

export const createWorkProductDetail = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = workProductDetailSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ message: "Error de validación", errors: validationResult.error.errors });
            return;
        }
        const newDetail = workProductDetailRepository.create(validationResult.data);
        console.log(newDetail);

        const work_order_id = newDetail.work_order_id;

        const workOrder = await AppDataSource.getRepository(WorkOrder).findOneBy({ work_order_id: work_order_id });
        if (!workOrder) {
            res.status(404).json({ message: "Orden de trabajo no encontrada" });
            return;
        }
        const quotation_id = workOrder.quotation_id;

        console.log(quotation_id);

        newDetail.quotation_id = quotation_id;


        await workProductDetailRepository.save(newDetail);
        res.status(201).json({ message: "Detalle de producto de trabajo creado exitosamente", workProductDetail: newDetail });
    } catch (error) {
        res.status(500).json({ message: "Error al crear el detalle de producto de trabajo", error });
    }
};

export const updateWorkProductDetail = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }
        const detail = await workProductDetailRepository.findOneBy({ work_product_detail_id: id });
        if (!detail) {
            res.status(404).json({ message: "Detalle de producto de trabajo no encontrado" });
            return;
        }
        const validationResult = workProductDetailSchema.partial().safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ message: "Error de validación", errors: validationResult.error.errors });
            return;
        }
        workProductDetailRepository.merge(detail, validationResult.data);
        await workProductDetailRepository.save(detail);
        res.json({ message: "Detalle de producto de trabajo actualizado exitosamente", workProductDetail: detail });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el detalle de producto de trabajo", error });
    }
};

export const deleteWorkProductDetail = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }
        const result = await workProductDetailRepository.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: "Detalle de producto de trabajo no encontrado" });
            return;
        }
        res.json({ message: "Detalle de producto de trabajo eliminado exitosamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el detalle de producto de trabajo", error });
    }
};