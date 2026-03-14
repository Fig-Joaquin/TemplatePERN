/* eslint-disable no-console */
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { QuotationService, Quotation, Service } from "../../entities";
import {
    quotationServiceSchema,
    updateQuotationServiceSchema,
} from "../../schema/work/quotationServiceValidator";

const quotationServiceRepository = AppDataSource.getRepository(QuotationService);
const quotationRepository = AppDataSource.getRepository(Quotation);
const serviceRepository = AppDataSource.getRepository(Service);

// POST /quotations/:id/services
export const addServiceToQuotation = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const quotationId = parseInt(req.params.id);
        if (isNaN(quotationId)) {
            res.status(400).json({ message: "ID de cotización inválido" });
            return;
        }

        const validationResult = quotationServiceSchema.safeParse(req.body);
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

        const quotation = await quotationRepository.findOneBy({ quotation_id: quotationId });
        if (!quotation) {
            res.status(404).json({ message: "Cotización no encontrada" });
            return;
        }

        const service = await serviceRepository.findOneBy({ service_id, is_active: true });
        if (!service) {
            res.status(404).json({ message: "Servicio no encontrado o inactivo" });
            return;
        }

        const subtotal = cantidad * precio_unitario;

        const newDetail = quotationServiceRepository.create({
            quotation,
            service,
            cantidad,
            precio_unitario,
            subtotal,
        });

        await quotationServiceRepository.save(newDetail);

        res.status(201).json({
            message: "Servicio agregado a la cotización exitosamente",
            quotationService: {
                ...newDetail,
                service,
            },
        });
    } catch (error) {
        console.error("Error al agregar servicio a cotización:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// GET /quotations/:id/services
export const getServicesByQuotation = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const quotationId = parseInt(req.params.id);
        if (isNaN(quotationId)) {
            res.status(400).json({ message: "ID de cotización inválido" });
            return;
        }

        const quotation = await quotationRepository.findOneBy({ quotation_id: quotationId });
        if (!quotation) {
            res.status(404).json({ message: "Cotización no encontrada" });
            return;
        }

        const details = await quotationServiceRepository.find({
            where: { quotation: { quotation_id: quotationId } },
            relations: ["service"],
        });

        res.json(details);
    } catch (error) {
        console.error("Error al obtener servicios de cotización:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// PUT /quotation-services/:id
export const updateQuotationService = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const detail = await quotationServiceRepository.findOne({
            where: { id },
            relations: ["service"],
        });
        if (!detail) {
            res.status(404).json({ message: "Detalle de servicio no encontrado" });
            return;
        }

        const validationResult = updateQuotationServiceSchema.safeParse(req.body);
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

        await quotationServiceRepository.update(id, {
            cantidad: newCantidad,
            precio_unitario: newPrecioUnitario,
            subtotal: newSubtotal,
        });

        const updated = await quotationServiceRepository.findOne({
            where: { id },
            relations: ["service"],
        });

        res.json({
            message: "Detalle de servicio actualizado exitosamente",
            quotationService: updated,
        });
    } catch (error) {
        console.error("Error al actualizar detalle de servicio en cotización:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// DELETE /quotation-services/:id
export const deleteQuotationService = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const detail = await quotationServiceRepository.findOneBy({ id });
        if (!detail) {
            res.status(404).json({ message: "Detalle de servicio no encontrado" });
            return;
        }

        await quotationServiceRepository.delete(id);

        res.json({ message: "Detalle de servicio eliminado exitosamente" });
    } catch (error) {
        console.error("Error al eliminar detalle de servicio en cotización:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};
