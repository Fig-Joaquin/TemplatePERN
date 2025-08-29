import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { Quotation } from "../../entities/work/quotationEntity";
import { QuotationSchema, QuotationUpdateSchema } from "../../schema/work/quotationValidator";
import { Vehicle } from "../../entities"; // <-- nueva importación
import { WorkProductDetail } from "../../entities/work/workProductDetailEntity"; // <-- nueva importación

const quotationRepository = AppDataSource.getRepository(Quotation); // <-- nuevo repositorio
const workProductDetailRepository = AppDataSource.getRepository(WorkProductDetail);
const vehicleRepository = AppDataSource.getRepository(Vehicle); // <-- nuevo repositorio


export const getAllQuotations = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const quotations = await quotationRepository.find({
            relations: ["vehicle", "vehicle.model", "vehicle.model.brand", "vehicle.owner", "vehicle.mileage_history", "vehicle.company"]
        });
        res.json(quotations);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener las cotizaciones", error });
    }
};

export const getQuotationById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const quotation = await quotationRepository.findOne({
            where: { quotation_id: id },
            relations: ["vehicle"]
        });
        if (!quotation) {
            res.status(404).json({ message: "Cotización no encontrada" });
            return;
        }
        res.json(quotation);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener la cotización", error });
    }
};

export const createQuotation = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = QuotationSchema.safeParse(req.body);
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
        
        const { vehicle_id, ...quotationData } = validationResult.data as { vehicle_id: number } & Record<string, unknown>;

        // Verificar que al menos person_id o company_id esté presente


        // Verificar que el vehicle_id exista en el repositorio de Vehicle
        const vehicle = await vehicleRepository.findOneBy({ vehicle_id });
        if (!vehicle) {
            res.status(404).json({ message: "Vehículo no encontrado" });
            return;
        }


        const newQuotation = quotationRepository.create({
            ...quotationData,
            vehicle,
        });
        await quotationRepository.save(newQuotation);
        res.status(201).json({ message: "Cotización creada exitosamente", quotation: newQuotation });
    } catch (error) {
        res.status(500).json({ message: "Error al crear la cotización", error });
    }
};

export const updateQuotation = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }
        const quotation = await quotationRepository.findOneBy({ quotation_id: id });
        if (!quotation) {
            res.status(404).json({ message: "Cotización no encontrada" });
            return;
        }
        const updateSchema = QuotationUpdateSchema;
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
        const updateData = validationResult.data as Record<string, unknown>;
        // Si se provee vehicle_id directamente, se verifica la existencia y se reemplaza con el objeto vehicle
        if ('vehicle_id' in updateData && updateData.vehicle_id) {
            const vehicle = await vehicleRepository.findOneBy({ vehicle_id: updateData.vehicle_id as number });
            if (!vehicle) {
                res.status(404).json({ message: "Vehículo no encontrado" });
                return;
            }
            updateData.vehicle = vehicle;
            delete updateData.vehicle_id;
        }
        quotationRepository.merge(quotation, updateData);
        await quotationRepository.save(quotation);
        res.json({ message: "Cotización actualizada exitosamente", quotation });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar la cotización", error });
    }
};

export const deleteQuotation = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }
        const quotation = await quotationRepository.findOne({
            where: { quotation_id: id },
            relations: ["vehicle", "vehicle.model", "vehicle.model.brand", "vehicle.owner", "vehicle.mileage_history", "vehicle.company"]
        });
        if (!quotation) {
            res.status(404).json({ message: "Cotización no encontrada" });
            return;
        }
        // Remove dependent work product details referencing this quotation
        await workProductDetailRepository.delete({ quotation: { quotation_id: quotation.quotation_id } });
        await quotationRepository.remove(quotation);
        res.json({ message: "Cotización eliminada exitosamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar la cotización", error });
    }
};

export const getQuotationsByVehicleLicensePlate = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { licensePlate } = req.params;
        
        const quotations = await quotationRepository.find({
            where: { 
                vehicle: { 
                    license_plate: licensePlate.toUpperCase() 
                } 
            },
            relations: [
                "vehicle",
                "vehicle.model", 
                "vehicle.model.brand", 
                "vehicle.owner", 
                "vehicle.company",
                "productDetails",
                "productDetails.product",
                "productDetails.tax"
            ]
        });

        res.json(quotations);
    } catch (error) {
        console.error("Error al obtener cotizaciones por patente:", error);
        res.status(500).json({ 
            message: "Error al obtener cotizaciones por patente", 
            error: error instanceof Error ? error.message : error 
        });
    }
};