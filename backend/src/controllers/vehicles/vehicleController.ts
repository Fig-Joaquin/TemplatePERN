/* eslint-disable no-console */
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { MileageHistory } from "../../entities/vehicles/mileageHistoryEntity";
import { DeepPartial, QueryFailedError } from "typeorm";
import { VehicleModel, Person, Company, Vehicle, WorkOrder, Quotation, WorkProductDetail } from "../../entities";
import { vehicleSchema } from "../../schema/vehicles/vehicleValidator";




// src/controllers/vehicleController.ts

const vehicleRepository = AppDataSource.getRepository(Vehicle);
const companiesEntity = AppDataSource.getRepository(Company);
const modelRepository = AppDataSource.getRepository(VehicleModel);
const ownerRepository = AppDataSource.getRepository(Person);
const mileageHistoryRepository = AppDataSource.getRepository(MileageHistory);

export const getAllVehicles = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const vehicles = await vehicleRepository
        
            .createQueryBuilder("vehicle")
            .leftJoinAndSelect("vehicle.model", "model")
            .leftJoinAndSelect("model.brand", "brand")
            .leftJoinAndSelect("vehicle.owner", "owner")
            .leftJoinAndSelect("vehicle.mileage_history", "mileage_history")
            .leftJoinAndSelect("vehicle.company", "company")
            .getMany();

        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener vehículos", error });
    }
};

export const getVehiclesByPersonId = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { personId } = req.params;
        const vehicles = await vehicleRepository.find({
            where: { owner: { person_id: parseInt(personId) } },
            relations: ["model", "model.brand", "owner", "mileage_history", "company"]
        });
        if (vehicles.length === 0) {
            res.status(404).json({ message: "No se encontraron vehículos para el propietario especificado" });
            return;
        }
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener vehículos por propietario", error });
    }
};

export const getVehicleById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const vehicle = await vehicleRepository.findOne({
            where: { vehicle_id: parseInt(id) },
            relations: ["model", "model.brand", "owner", "mileage_history", "company"]
        });
        if (!vehicle) {
            res.status(404).json({ message: "Vehículo no encontrado" });
            return;
        }
        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener vehículo", error });
    }
};


export const createVehicle = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        console.log("Body:", req.body);
        const validationResult = vehicleSchema.safeParse(req.body);
        if (!validationResult.success) {
            console.log("Error de validación:", validationResult.error.errors);
            res.status(400).json({
                message: "Error de validación",
                errors: validationResult.error.errors.map(err => ({
                    field: err.path.join("."),
                    message: err.message
                }))
            });
            return;
        }
        // Extraer IDs directamente, ya vienen sin nestear.
        const { vehicle_model_id, person_id, company_id, ...vehicleData } = validationResult.data;
        const mileageHistoryData = req.body.mileageHistory;

        console.log("Datos validados:", vehicleData);
        //Verificar si person_id o company_id está presente
        if (!person_id && !company_id) {
            res.status(400).json({ message: "Debe proporcionar una persona o compañía" });
            return;
        }
        let company: Company | undefined;
        if (company_id) {
            company = await companiesEntity.findOneBy({ company_id }) ?? undefined;
            if (!company) {
                res.status(404).json({ message: "La compañía especificada no existe." });
                return;
            }   
        }


        console.log("Datos de kilometraje:", mileageHistoryData);

        // Verificar si el modelo existe usando el ID directo
        const model = await modelRepository.findOneBy({ vehicle_model_id });
        if (!model) {
            res.status(404).json({ message: "El modelo especificado no existe." });
            return;
        }
        let owner: Person | undefined;
        if (person_id) {
            owner = await ownerRepository.findOneBy({ person_id }) || undefined;
            if (!owner) {
                res.status(404).json({ message: "El propietario especificado no existe." });
                return;
            }
        }
        // Validar mileageHistoryData
        if (mileageHistoryData === null || mileageHistoryData === undefined) {
            res.status(400).json({ message: "Se requiere un registro de kilometraje inicial." });
            return;
        }
        const mileageRecords: DeepPartial<MileageHistory>[] = [
            typeof mileageHistoryData === 'number'
            ? { current_mileage: mileageHistoryData }
            : { ...mileageHistoryData }
        ];
        const vehicle = vehicleRepository.create({
            ...vehicleData,
            model,
            ...(owner ? { owner } : {}),
            ...(company ? { company } : {}),
            mileage_history: mileageRecords
        });
        await vehicleRepository.save(vehicle);
        res.status(201).json({ message: "Vehículo creado exitosamente", vehicle });
    } catch (error) {
        if (error instanceof QueryFailedError) {
            if (error instanceof Object && 'code' in error && error.code === "23505") {
                res.status(409).json({
                    message: `El vehículo con patente '${req.body.license_plate}' ya está registrado.`,
                    error: 'detail' in error ? error.detail : 'Error de duplicación'
                });
                return;
            }
        }
        console.error("Error al crear vehículo:", error);
        res.status(500).json({ 
            message: "Error interno al crear vehículo",
            error: error instanceof Error ? error.message : error
        });
    }
};


export const updateVehicle = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        console.log("Update vehicle request body:", req.body);
        const { id } = req.params;
        
        // Cargar el vehículo junto con sus relaciones
        const vehicle = await vehicleRepository.findOne({
            where: { vehicle_id: parseInt(id) },
            relations: ["model", "owner", "company", "mileage_history"]
        });
        
        if (!vehicle) {
            res.status(404).json({ message: "Vehículo no encontrado" });
            return;
        }

        // Usar un esquema parcial para actualizar
        const updateSchema = vehicleSchema.partial();
        const validationResult = updateSchema.safeParse(req.body);
        if (!validationResult.success) {
            console.log("Validation errors:", validationResult.error.errors);
            res.status(400).json({ 
                message: "Error de validación", 
                errors: validationResult.error.errors 
            });
            return;
        }
        
        // Extraer IDs y datos del vehículo
        const { vehicle_model_id, person_id, company_id, ...vehicleData } = validationResult.data;
        const mileageHistory = req.body.mileageHistory;
        
        // Actualizar modelo si se proporciona
        if (vehicle_model_id) {
            const model = await modelRepository.findOneBy({ vehicle_model_id });
            if (!model) {
                res.status(404).json({ message: "El modelo especificado no existe." });
                return;
            }
            vehicle.model = model;
        }

        // Actualizar propietario según los IDs proporcionados
        if (person_id !== undefined) {
            if (person_id === null) {
                vehicle.owner = null;
            } else {
                const owner = await ownerRepository.findOneBy({ person_id });
                if (!owner) {
                    res.status(404).json({ message: "El propietario especificado no existe." });
                    return;
                }
                vehicle.owner = owner;
            }
        }

        // Actualizar compañía solo si se proporciona explícitamente company_id
        if (company_id !== undefined) {
            if (company_id === null) {
                vehicle.company = null;
            } else {
                const company = await companiesEntity.findOneBy({ company_id });
                if (!company) {
                    res.status(404).json({ message: "La compañía especificada no existe." });
                    return;
                }
                vehicle.company = company;
            }
        }

        // Asegurarse que el vehículo pertenece a alguien (persona o compañía)
        if (vehicle.owner === null && vehicle.company === null) {
            res.status(400).json({ message: "El vehículo debe pertenecer a una persona o compañía" });
            return;
        }
        
        // Actualizar los campos del vehículo
        vehicleRepository.merge(vehicle, vehicleData);

        // Guardar primero el vehículo actualizado para asegurar que tenga un vehicle_id válido
        const savedVehicle = await vehicleRepository.save(vehicle);
        
        // Procesar el historial de kilometraje solo después de guardar el vehículo
        if (mileageHistory) {
            if (Array.isArray(mileageHistory) && mileageHistory.length > 0) {
                // Procesar array de registros
                for (const record of mileageHistory) {
                    const mileageRecord = mileageHistoryRepository.create({
                        vehicle: savedVehicle,
                        current_mileage: typeof record === 'number' ? record : record.current_mileage,
                        ...(typeof record !== 'number' ? record : {})
                    });
                    await mileageHistoryRepository.save(mileageRecord);
                }
            } else if (typeof mileageHistory === 'number' && mileageHistory > 0) {
                // Procesar un único valor numérico
                const mileageRecord = mileageHistoryRepository.create({
                    vehicle: savedVehicle,
                    current_mileage: mileageHistory
                });
                await mileageHistoryRepository.save(mileageRecord);
            }
        }
        
        // Obtener el vehículo actualizado con todas las relaciones
        const updatedVehicle = await vehicleRepository.findOne({
            where: { vehicle_id: parseInt(id) },
            relations: ["model", "model.brand", "owner", "company", "mileage_history"]
        });
        
        res.json(updatedVehicle);
    } catch (error) {
        console.error("Error al actualizar vehículo:", error);
        res.status(500).json({ 
            message: "Error al actualizar vehículo", 
            error: error instanceof Error ? error.message : String(error)
        });
    }
};


// Agrega el repositorio de WorkOrder para eliminar órdenes de trabajo relacionadas
const workOrderRepository = AppDataSource.getRepository(WorkOrder);

export const deleteVehicle = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const vehicle = await vehicleRepository.findOne({
            where: { vehicle_id: parseInt(id) },
            relations: ["mileage_history"]
        });

        if (!vehicle) {
            res.status(404).json({ message: "Vehículo no encontrado" });
            return;
        }

        // Verificar y eliminar los registros relacionados en "mileage_history"
        if (vehicle.mileage_history && vehicle.mileage_history.length > 0) {
            await mileageHistoryRepository.createQueryBuilder()
                .delete()
                .from("mileage_history")
                .where("vehicle_id = :id", { id: vehicle.vehicle_id })
                .execute();
        }

        // Verificar si existen órdenes de trabajo asociadas al vehículo y eliminarlas (cascade)
        const workOrders = await workOrderRepository.find({
            where: {
                vehicle: { vehicle_id: vehicle.vehicle_id }
            }
        });
        if (workOrders.length > 0) {
            await workOrderRepository.createQueryBuilder()
                .delete()
                .from("work_orders")
                .where("vehicle_id = :id", { id: vehicle.vehicle_id })
                .execute();
        }

        // Verificar si existen cotizaciones asociadas al vehículo y eliminarlas
        const quotationRepository = AppDataSource.getRepository(Quotation);
        const quotations = await quotationRepository.find({
            where: {
                vehicle: { vehicle_id: vehicle.vehicle_id }
            }
        });
        if (quotations.length > 0) {
            const workProductDetailsRepository = AppDataSource.getRepository(WorkProductDetail);
            await workProductDetailsRepository.createQueryBuilder()
                .delete()
                .from("work_product_details")
                .where("quotation_id IN (:...quotationIds)", { quotationIds: quotations.map(q => q.quotation_id) })
                .execute();

            await quotationRepository.createQueryBuilder()
                .delete()
                .from("quotations")
                .where("vehicle_id = :id", { id: vehicle.vehicle_id })
                .execute();
        }

        // Ahora eliminar el vehículo
        await vehicleRepository.createQueryBuilder()
            .delete()
            .from("vehicles")
            .where("vehicle_id = :id", { id: vehicle.vehicle_id })
            .execute();

        res.json({ message: "Vehículo, su historial de kilometraje, órdenes de trabajo y cotizaciones eliminados exitosamente" });
    } catch (error) {
        console.error("Error al eliminar vehículo:", error);
        res.status(500).json({ message: "Error al eliminar vehículo", error });
    }
};
