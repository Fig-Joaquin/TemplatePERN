import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { Service } from "../../entities";
import { ServiceSchema } from "../../schema/work/serviceValidator";

const serviceRepository = AppDataSource.getRepository(Service);

export const getAllServices = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const services = await serviceRepository.find();
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los servicios", error });
    }
};

export const getServiceById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const service = await serviceRepository.findOneBy({ service_id: id });
        if (!service) {
            res.status(404).json({ message: "Servicio no encontrado" });
            return;
        }

        res.json(service);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el servicio", error });
    }
};

export const createService = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = ServiceSchema.safeParse(req.body);
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

        const { service_name } = validationResult.data;

        // Verificar si ya existe un servicio con el mismo nombre
        const existingService = await serviceRepository.findOneBy({ service_name });
        if (existingService) {
            res.status(409).json({ message: `El servicio '${service_name}' ya existe.` });
            return;
        }

        const newService = serviceRepository.create(validationResult.data);
        await serviceRepository.save(newService);

        res.status(201).json({ message: "Servicio creado exitosamente", service: newService });
    } catch (error) {
        res.status(500).json({ message: "Error al crear el servicio", error });
    }
};

export const updateService = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const service = await serviceRepository.findOneBy({ service_id: id });
        if (!service) {
            res.status(404).json({ message: "Servicio no encontrado" });
            return;
        }

        const validationResult = ServiceSchema.partial().safeParse(req.body);
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

        // Si se está actualizando el nombre, verificar que no exista otro servicio con ese nombre
        if (validationResult.data.service_name &&
            validationResult.data.service_name !== service.service_name) {
            const existingService = await serviceRepository.findOneBy({
                service_name: validationResult.data.service_name
            });
            if (existingService) {
                res.status(409).json({
                    message: `El servicio '${validationResult.data.service_name}' ya existe.`
                });
                return;
            }
        }

        serviceRepository.merge(service, validationResult.data);
        await serviceRepository.save(service);

        res.json({ message: "Servicio actualizado exitosamente", service });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el servicio", error });
    }
};

export const deactivateService = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const service = await serviceRepository.findOneBy({ service_id: id });
        if (!service) {
            res.status(404).json({ message: "Servicio no encontrado" });
            return;
        }

        if (!service.is_active) {
            res.status(400).json({ message: "El servicio ya está desactivado" });
            return;
        }

        service.is_active = false;
        await serviceRepository.save(service);

        res.json({ message: "Servicio desactivado exitosamente", service });
    } catch (error) {
        res.status(500).json({ message: "Error al desactivar el servicio", error });
    }
};

export const activateService = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const service = await serviceRepository.findOneBy({ service_id: id });
        if (!service) {
            res.status(404).json({ message: "Servicio no encontrado" });
            return;
        }

        if (service.is_active) {
            res.status(400).json({ message: "El servicio ya está activado" });
            return;
        }

        service.is_active = true;
        await serviceRepository.save(service);

        res.json({ message: "Servicio activado exitosamente", service });
    } catch (error) {
        res.status(500).json({ message: "Error al activar el servicio", error });
    }
};
