import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { Quotation } from "../../entities/work/quotationEntity";
import { QuotationSchema } from "../../schema/quotationValidator";
import { Vehicle, Person, Company } from "../../entities"; // <-- nueva importación

const quotationRepository = AppDataSource.getRepository(Quotation);
const vehicleRepository = AppDataSource.getRepository(Vehicle); // <-- nuevo repositorio
const personRepository = AppDataSource.getRepository(Person);
const companyRepository = AppDataSource.getRepository(Company);

export const getAllQuotations = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const quotations = await quotationRepository.find({
            relations: ["vehicle", "vehicle.model", "vehicle.model.brand", "vehicle.owner", "vehicle.mileage_history"]
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
        
        const { vehicle_id, person_id, company_id, ...quotationData } = validationResult.data as any;

        // Verificar que al menos person_id o company_id esté presente
        if (!person_id && !company_id) {
            res.status(400).json({ message: "Debe proporcionar una persona o compañia" });
            return;
        }

        // Verificar que el vehicle_id exista en el repositorio de Vehicle
        const vehicle = await vehicleRepository.findOneBy({ vehicle_id });
        if (!vehicle) {
            res.status(404).json({ message: "Vehículo no encontrado" });
            return;
        }

        // Verificar que el person_id exista en el repositorio de Person
        if (person_id) {
            const person = await personRepository.findOneBy({ person_id });
            if (!person) {
                res.status(404).json({ message: "Persona no encontrada" });
                return;
            }
            quotationData.person = person;
        }

        // Verificar que el company_id exista en el repositorio de Company
        if (company_id) {
            const company = await companyRepository.findOneBy({ company_id });
            if (!company) {
                res.status(404).json({ message: "Compañía no encontrada" });
                return;
            }
            quotationData.company = company;
        }

        const newQuotation = quotationRepository.create({
            ...quotationData,
            vehicle,
            person: quotationData.person,
            company: quotationData.company
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
        const updateSchema = QuotationSchema.partial();
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
        const updateData = validationResult.data as any;
        // Si se provee vehicle_id directamente, se verifica la existencia y se reemplaza con el objeto vehicle
        if (updateData.vehicle_id) {
            const vehicle = await vehicleRepository.findOneBy({ vehicle_id: updateData.vehicle_id });
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
        const result = await quotationRepository.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: "Cotización no encontrada" });
            return;
        }
        res.json({ message: "Cotización eliminada exitosamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar la cotización", error });
    }
};