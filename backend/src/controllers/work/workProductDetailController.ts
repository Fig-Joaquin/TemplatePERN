/* eslint-disable no-console */
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { DeepPartial } from "typeorm";
import { WorkProductDetail, WorkOrder, Product, Quotation, Tax} from "../../entities";
import { workProductDetailSchema } from "../../schema/work/workProductDetailValidator";

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

export const getWorkProductDetailsByQuotationId = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const quotationId = parseInt(req.params.quotationId);
        if (isNaN(quotationId)) {
            res.status(400).json({ message: "ID de cotización inválido" });
            return;
        }
        const details = await workProductDetailRepository.find({
            where: { quotation: { quotation_id: quotationId } },
            relations: ["work_order", "work_order.vehicle", "product", "quotation", "tax"]
        });
        if (details.length === 0) {
            res.status(404).json({ message: "No se encontraron detalles para la cotización" });
            return;
        }
        res.json(details);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener detalles por cotización", error });
    }
};

export const getWorkProductDetailsByWorkOrderId = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const workOrderId = parseInt(req.params.workOrderId);
        if (isNaN(workOrderId)) {
            res.status(400).json({ message: "ID de orden de trabajo inválido" });
            return;
        }
        const details = await workProductDetailRepository.find({
            where: { work_order: { work_order_id: workOrderId } },
            relations: ["work_order", "work_order.vehicle", "product", "quotation", "tax"]
        });
        res.json(details);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener detalles por orden de trabajo", error });
    }
};

interface WorkProductDetailInput {
    work_order_id?: number;
    product_id: number;
    quotation_id?: number;
    tax_id: number;
    [key: string]: unknown;
}

export const createWorkProductDetail = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = workProductDetailSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ message: "Error de validación", errors: validationResult.error.errors });
            return;
        }

        // Extraer IDs y demás datos
        const { work_order_id, product_id, quotation_id, tax_id, ...rest } = validationResult.data as WorkProductDetailInput;


        console.log("work_order_id: ", work_order_id + " quotation_id: ", quotation_id );

        // Validar que al menos se proporcione work_order_id o quotation_id
        if (!work_order_id && !quotation_id) {
            res.status(400).json({ message: "Debe proporcionar al menos work_order_id o quotation_id" });
            return;
        }

        // Verificar existencia de WorkOrder si se proporcionó
        let workOrder;
        if (work_order_id) {
            workOrder = await workOrderRepository.findOneBy({ work_order_id: work_order_id });
            if (!workOrder) {
                res.status(404).json({ message: "Orden de trabajo no encontrada" });
                return;
            }
        }

        // Verificar existencia de Product
        const product = await productRepository.findOneBy({ product_id: product_id });
        if (!product) {
            res.status(404).json({ message: "Producto no encontrado" });
            return;
        }

        // Verificar existencia de Quotation si se proporcionó
        let quotation;
        if (quotation_id) {
            quotation = await quotationRepository.findOneBy({ quotation_id: quotation_id });
            if (!quotation) {
                res.status(404).json({ message: "Cotización no encontrada" });
                return;
            }
        }

        // Verificar existencia de Tax
        const tax = await taxRepository.findOneBy({ tax_id: tax_id });
        if (!tax) {
            res.status(404).json({ message: "Impuesto no encontrado" });
            return;
        }

        // Crear el detalle asignando las entidades opcionales si fueron proporcionadas
        const newDetail = workProductDetailRepository.create({
            ...rest,
            ...(workOrder && { work_order: workOrder }),
            product,
            ...(quotation && { quotation }),
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
        
        console.log("Update request for detail ID:", id);
        console.log("Request body:", req.body);
        
        const detail = await workProductDetailRepository.findOneBy({ work_product_detail_id: id });
        if (!detail) {
            res.status(404).json({ message: "Detalle de producto de trabajo no encontrado" });
            return;
        }
        
        // Validate only the basic fields for updates
        const validationResult = workProductDetailSchema.partial().safeParse(req.body);
        if (!validationResult.success) {
            console.error("Validation errors:", validationResult.error.errors);
            res.status(400).json({ 
                message: "Error de validación", 
                errors: validationResult.error.errors 
            });
            return;
        }
        
        const updateData = validationResult.data;
        console.log("Validated update data:", updateData);
        
        // Only update the basic fields, don't touch relationships
        const fieldsToUpdate: Partial<WorkProductDetail> = {};
        if (updateData.quantity !== undefined) fieldsToUpdate.quantity = updateData.quantity;
        if (updateData.sale_price !== undefined) fieldsToUpdate.sale_price = updateData.sale_price;
        if (updateData.labor_price !== undefined) fieldsToUpdate.labor_price = updateData.labor_price;
        if (updateData.discount !== undefined) fieldsToUpdate.discount = updateData.discount;
        
        // Update the detail
        await workProductDetailRepository.update(id, fieldsToUpdate);
        
        // Fetch the updated detail with relations
        const updatedDetail = await workProductDetailRepository.findOne({
            where: { work_product_detail_id: id },
            relations: ["work_order", "product", "quotation", "tax"]
        });
        
        res.json({ 
            message: "Detalle de producto de trabajo actualizado exitosamente", 
            workProductDetail: updatedDetail 
        });
    } catch (error) {
        console.error("Error updating work product detail:", error);
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