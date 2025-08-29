/* eslint-disable no-console */
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { Company } from "../../entities/work/companiesEntity";
import { companiesSchema, updateCompaniesSchema } from "../../schema/work/companiesValidator";

const companyRepository = AppDataSource.getRepository(Company);

export const getAllCompanies = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const companies = await companyRepository.find(
            {
                relations: [
                    "vehicles",
                    "vehicles.model",
                    "vehicles.owner",
                    "vehicles.company",
                    "vehicles.model.brand",
                ]
            }
        );
        res.json(companies);
        return;
    } catch (error) {
        res.status(500).json({ message: "Error al obtener empresas", error });
        return;
    }
};

export const getCompanyById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const company = await companyRepository.findOneBy({ company_id: parseInt(id, 10) });

        if (!company) {
            res.status(404).json({ message: "Empresa no encontrada" });
            return;
        }

        res.json(company);
        return;
    } catch (error) {
        res.status(500).json({ message: "Error al obtener empresa", error });
        return;
    }
};

export const createCompany = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        console.log(req.body);
        // Validación con Zod
        const validationResult = companiesSchema.safeParse(req.body);
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

        const { rut, email, phone } = validationResult.data;

        // Check uniqueness for all provided fields
        const uniquenessChecks = [
            checkCompanyFieldUniqueness('rut', rut)
        ];
        
        if (email !== undefined) {
            uniquenessChecks.push(checkCompanyFieldUniqueness('email', email));
        }
        
        if (phone !== undefined) {
            uniquenessChecks.push(checkCompanyFieldUniqueness('phone', phone));
        }

        const uniquenessResults = await Promise.all(uniquenessChecks);
        const errorMessage = uniquenessResults.find(result => result !== null);
        
        if (errorMessage) {
            res.status(409).json({ message: errorMessage });
            return;
        }

        // Crear empresa
        const company = companyRepository.create(validationResult.data);
        await companyRepository.save(company);
        res.status(201).json({ message: "Empresa creada exitosamente", company });
    } catch (error: unknown) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === "23505") {
            res.status(409).json({ message: "El RUT ya existe en el sistema" });
            return;
        }
        console.error("Error al crear empresa:", error);
        res.status(500).json({ 
            message: "Error interno al crear empresa",
            error: error instanceof Error ? error.message : error
        });
    }
};

// Helper function to check company field uniqueness
const checkCompanyFieldUniqueness = async (
    field: 'rut' | 'email' | 'phone',
    value: string,
    currentCompanyId?: number
): Promise<string | null> => {
    const whereCondition = { [field]: value };
    const existingCompany = await companyRepository.findOneBy(whereCondition);
    
    if (existingCompany && existingCompany.company_id !== currentCompanyId) {
        const fieldNames = {
            rut: 'RUT',
            email: 'email',
            phone: 'número de teléfono'
        };
        return `El ${fieldNames[field]} '${value}' ya está registrado en el sistema.`;
    }
    
    return null;
};

export const updateCompany = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        console.log(req.body);
        const { id } = req.params;
        const companyId = parseInt(id, 10);
        const company = await companyRepository.findOneBy({ company_id: companyId });

        if (!company) {
            res.status(404).json({ message: "Empresa no encontrada" });
            return;
        }

        const validationResult = updateCompaniesSchema.safeParse(req.body);
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

        const { rut, email, phone } = validationResult.data;

        // Check uniqueness for fields that are being updated
        const uniquenessChecks = [];
        if (rut !== undefined && rut !== company.rut) {
            uniquenessChecks.push(checkCompanyFieldUniqueness('rut', rut, companyId));
        }
        if (email !== undefined && email !== company.email) {
            uniquenessChecks.push(checkCompanyFieldUniqueness('email', email, companyId));
        }
        if (phone !== undefined && phone !== company.phone) {
            uniquenessChecks.push(checkCompanyFieldUniqueness('phone', phone, companyId));
        }

        const uniquenessResults = await Promise.all(uniquenessChecks);
        const errorMessage = uniquenessResults.find(result => result !== null);
        
        if (errorMessage) {
            res.status(409).json({ message: errorMessage });
            return;
        }

        companyRepository.merge(company, validationResult.data);
        await companyRepository.save(company);
        res.json({ message: "Empresa actualizada exitosamente", company });
        return;
    } catch (error: unknown) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === "23505") {
            res.status(400).json({ message: "Datos duplicados en el sistema" });
            return;
        }
        res.status(500).json({ message: "Error al actualizar empresa", error });
        return;
    }
};

export const deleteCompany = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id, 10);

        // Verificar si la empresa existe antes de eliminar
        const company = await companyRepository.findOneBy({ company_id: parsedId });
        if (!company) {
            res.status(404).json({ message: "Empresa no encontrada" });
            return;
        }

        try {
            const result = await companyRepository.delete(parsedId);
            if (result.affected === 0) {
                res.status(404).json({ message: "No se pudo eliminar la empresa" });
                return;
            }
            res.status(204).send();
        } catch {
            res.status(409).json({ message: "No se puede eliminar la empresa porque tiene registros asociados." });
        }
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar empresa", error });
        return;
    }
};
