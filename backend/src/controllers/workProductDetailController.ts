import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/ormconfig";
import { WorkProductDetail } from "../entities/workProductDetailEntity";
import { workProductDetailSchema } from "../schema/workProductDetailValidator";
import { WorkOrder } from "../entities/workOrderEntity";
import { Product } from "../entities/productEntity";         // nuevo import
import { Quotation } from "../entities/quotationEntity";         // nuevo import
import { Tax } from "../entities/taxEntity";         // nuevo import
import { DeepPartial } from "typeorm";

const workProductDetailRepository = AppDataSource.getRepository(WorkProductDetail);
const workOrderRepository = AppDataSource.getRepository(WorkOrder);      // nuevo repository
const productRepository = AppDataSource.getRepository(Product);          // nuevo repository
const quotationRepository = AppDataSource.getRepository(Quotation);      // nuevo repository
const taxRepository = AppDataSource.getRepository(Tax);      // nuevo repository

export const getAllWorkProductDetails = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const details = await workProductDetailRepository.find({
            relations: ["work_order", "work_order.vehicle", "product", "quotation", "tax"]
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

        // Extraer IDs y demás datos
        const { work_order_id, product_id, quotation_id, tax_id, ...rest } = validationResult.data as any;

        // Verificar existencia de WorkOrder
        const workOrder = await workOrderRepository.findOneBy({ work_order_id: parseInt(work_order_id) });
        if (!workOrder) {
            res.status(404).json({ message: "Orden de trabajo no encontrada" });
            return;
        }

        // Verificar existencia de Product
        const product = await productRepository.findOneBy({ product_id: parseInt(product_id) });
        if (!product) {
            res.status(404).json({ message: "Producto no encontrado" });
            return;
        }

        // Verificar existencia de Quotation
        const quotation = await quotationRepository.findOneBy({ quotation_id: parseInt(quotation_id) });
        if (!quotation) {
            res.status(404).json({ message: "Cotización no encontrada" });
            return;
        }

        //verificar existencia de Tax
        const tax = await taxRepository.findOneBy({ tax_id: parseInt(tax_id) });
        if (!tax) {
            res.status(404).json({ message: "Impuesto no encontrado" });
            return;
        }

        // Crear el detalle asociando las entidades
        const newDetail = workProductDetailRepository.create({
            ...rest,
            work_order: workOrder,
            product,
            quotation,
            tax
        } as DeepPartial<WorkProductDetail>);
        
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
        workProductDetailRepository.merge(detail, validationResult.data as DeepPartial<WorkProductDetail>);
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