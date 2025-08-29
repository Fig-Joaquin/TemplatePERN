// src/controllers/personController.ts
/* eslint-disable no-console */
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/ormconfig";
import { Person } from "../entities/personsEntity";
import { PersonSchema, UpdatePersonSchema } from "../schema/personsValidator";
import { Vehicle } from "../entities/vehicles/vehicleEntity";

const personRepository = AppDataSource.getRepository(Person);

export const getAllPersons = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { person_type } = req.query;
        let persons;
        if (person_type) {
            persons = await personRepository.find({ where: { person_type: person_type as string } });
        } else {
            persons = await personRepository.find();
        }
        res.json(persons);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener personas", error });
    }
};


export const getPersonById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const person = await personRepository.findOneBy({ person_id: parseInt(id) });
        
        if (!person) {
            res.status(404).json({ message: "Persona no encontrada" });
            return;
        }
        
        res.json(person);
        return;
    } catch (error) {
        res.status(500).json({ message: "Error al obtener persona", error });
        return;
    }
};

export const createPerson = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        console.log(req.body);
        // Validar la entrada con Zod
        const validationResult = PersonSchema.safeParse(req.body);
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

        const { rut, email, number_phone } = validationResult.data;

         // Verificar unicidad de RUT solo si fue enviado
       if (rut !== undefined) {
            const existingPersonByRut = await personRepository.findOneBy({ rut });
            if (existingPersonByRut) {
                res.status(409).json({ message: `El RUT '${rut}' ya está registrado en el sistema.` });
                return;
            }
        }
            
        // Verificar si el email ya está registrado SOLO si existe
        if (email !== undefined) {
            const existingPersonByEmail = await personRepository.findOneBy({ email });
            if (existingPersonByEmail) {
                res.status(409).json({ message: `El email '${email}' ya está registrado en el sistema.` });
                return;
            }
        }

        // Verificar si el teléfono ya está registrado
        const existingPersonByPhone = await personRepository.findOneBy({ number_phone });
        if (existingPersonByPhone) {
            res.status(409).json({ message: `El número de teléfono '${number_phone}' ya está registrado en el sistema.` });
            return;
        }

        // Crear la persona
        const person = personRepository.create(validationResult.data);
        await personRepository.save(person);
        res.status(201).json({ message: "Persona creada exitosamente", person });
    } catch (error: unknown) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
            res.status(409).json({ message: "El RUT ya existe en el sistema" });
            return;
        }
        console.error("Error al crear persona:", error);
        res.status(500).json({ 
            message: "Error interno al crear persona",
            error: error instanceof Error ? error.message : error
        });
    }
};

// Helper function to check person field uniqueness
const checkPersonFieldUniqueness = async (
    field: 'rut' | 'email' | 'number_phone',
    value: string,
    currentPersonId?: number
): Promise<string | null> => {
    const whereCondition = { [field]: value };
    const existingPerson = await personRepository.findOneBy(whereCondition);
    
    if (existingPerson && existingPerson.person_id !== currentPersonId) {
        const fieldNames = {
            rut: 'RUT',
            email: 'email',
            number_phone: 'número de teléfono'
        };
        return `El ${fieldNames[field]} '${value}' ya está registrado en el sistema.`;
    }
    
    return null;
};

export const updatePerson = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        console.log(req.body);
        const { id } = req.params;
        const personId = parseInt(id);
        const person = await personRepository.findOneBy({ person_id: personId });
        
        if (!person) {
            res.status(404).json({ message: "Persona no encontrada" });
            return;
        }

        const validationResult = UpdatePersonSchema.safeParse(req.body);
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

        const { rut, email, number_phone } = validationResult.data;

        // Check uniqueness for fields that are being updated
        const uniquenessChecks = [];
        if (rut !== undefined && rut !== person.rut) {
            uniquenessChecks.push(checkPersonFieldUniqueness('rut', rut, personId));
        }
        if (email !== undefined && email !== person.email) {
            uniquenessChecks.push(checkPersonFieldUniqueness('email', email, personId));
        }
        if (number_phone !== undefined && number_phone !== person.number_phone) {
            uniquenessChecks.push(checkPersonFieldUniqueness('number_phone', number_phone, personId));
        }

        const uniquenessResults = await Promise.all(uniquenessChecks);
        const errorMessage = uniquenessResults.find(result => result !== null);
        
        if (errorMessage) {
            res.status(409).json({ message: errorMessage });
            return;
        }

        personRepository.merge(person, validationResult.data);
        await personRepository.save(person);
        res.json({ message: "Persona actualizada exitosamente", person });
        return;
    } catch (error: unknown) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
            res.status(409).json({ message: "Datos duplicados en el sistema" });
            return;
        }
        res.status(500).json({ message: "Error al actualizar persona", error });
        return;
    }
};

export const deletePerson = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
        const { id } = req.params;
        const personId = parseInt(id);
        
        // Check if person exists
        const person = await personRepository.findOneBy({ person_id: personId });
        if (!person) {
            res.status(404).json({ message: "Persona no encontrada" });
            return;
        }

        // Check if the person is assigned to active work orders as a technician
        const activeWorkOrdersQuery = `
            SELECT COUNT(*) as count, 
                   STRING_AGG(DISTINCT wo.work_order_id::text, ', ') as work_order_ids
            FROM work_order_technicians wot
            INNER JOIN work_orders wo ON wot.work_order_id = wo.work_order_id
            WHERE wot.technician_id = $1 
            AND wo.order_status IN ('not_started', 'in_progress')
        `;
        
        const activeWorkOrdersResult = await queryRunner.manager.query(activeWorkOrdersQuery, [personId]);
        const activeWorkOrdersCount = parseInt(activeWorkOrdersResult[0].count);
        
        if (activeWorkOrdersCount > 0) {
            const workOrderIds = activeWorkOrdersResult[0].work_order_ids;
            res.status(400).json({ 
                message: `No se puede eliminar el empleado porque está asignado como técnico a ${activeWorkOrdersCount} orden(es) de trabajo activa(s)`,
                details: `Órdenes de trabajo: ${workOrderIds}. Complete o cancele estas órdenes antes de eliminar el empleado.`,
                activeWorkOrders: activeWorkOrdersCount
            });
            return;
        }

        // If person is only assigned to completed work orders, we need to handle the deletion carefully
        // First, remove technician assignments from completed work orders
        await queryRunner.manager.query(
            `DELETE FROM work_order_technicians WHERE technician_id = $1`,
            [personId]
        );
        
        // 1. Obtener todos los vehículos de la persona
        const vehicleRepository = AppDataSource.getRepository(Vehicle);
        const vehicles = await vehicleRepository.find({
            where: { owner: { person_id: personId } }
        });
        
        const vehicleIds = vehicles.map(v => v.vehicle_id);
        
        if (vehicleIds.length > 0) {
            // 2. Eliminar registros de kilometraje
            await queryRunner.manager.query(
                `DELETE FROM mileage_history WHERE vehicle_id IN (${vehicleIds.join(',')})`
            );
            
            // 3. Eliminar pagos relacionados con órdenes de trabajo
            await queryRunner.manager.query(
                `DELETE FROM work_payments 
                 WHERE work_order_id IN (
                     SELECT work_order_id FROM work_orders WHERE vehicle_id IN (${vehicleIds.join(',')})
                 )`
            );
            
            // 4. Eliminar deudores relacionados con órdenes de trabajo
            await queryRunner.manager.query(
                `DELETE FROM debtors 
                 WHERE work_order_id IN (
                     SELECT work_order_id FROM work_orders WHERE vehicle_id IN (${vehicleIds.join(',')})
                 )`
            );
            
            // 5. Eliminar registros de técnicos asignados a órdenes de trabajo
            await queryRunner.manager.query(
                `DELETE FROM work_order_technicians 
                 WHERE work_order_id IN (
                     SELECT work_order_id FROM work_orders WHERE vehicle_id IN (${vehicleIds.join(',')})
                 )`
            );
            
            // 6. Eliminar detalles de productos de trabajo relacionados con órdenes de trabajo
            await queryRunner.manager.query(
                `DELETE FROM work_product_details 
                 WHERE work_order_id IN (
                     SELECT work_order_id FROM work_orders WHERE vehicle_id IN (${vehicleIds.join(',')})
                 )`
            );
            
            // 7. Primero eliminar órdenes de trabajo (antes que las cotizaciones)
            await queryRunner.manager.query(
                `DELETE FROM work_orders WHERE vehicle_id IN (${vehicleIds.join(',')})`
            );
            
            // 8. Eliminar detalles de productos de trabajo relacionados con cotizaciones
            await queryRunner.manager.query(
                `DELETE FROM work_product_details 
                 WHERE quotation_id IN (
                     SELECT quotation_id FROM quotations WHERE vehicle_id IN (${vehicleIds.join(',')})
                 )`
            );
            
            // 9. Ahora sí eliminar cotizaciones (después de eliminar órdenes de trabajo)
            await queryRunner.manager.query(
                `DELETE FROM quotations WHERE vehicle_id IN (${vehicleIds.join(',')})`
            );
            
            // 10. Finalmente eliminar los vehículos
            await queryRunner.manager.query(
                `DELETE FROM vehicles WHERE vehicle_id IN (${vehicleIds.join(',')})`
            );
        }
        
        // 11. Eliminar la persona
        const result = await queryRunner.manager.delete("persons", { person_id: personId });
        
        // Confirmar la transacción
        await queryRunner.commitTransaction();
        
        if (result.affected === 0) {
            res.status(404).json({ message: "Persona no encontrada" });
            return;
        }

        res.status(200).json({ 
            message: "Empleado y todos sus datos asociados eliminados exitosamente",
            deletedVehicles: vehicles.length
        });
    } catch (error) {
        // Si hay algún error, deshacer todos los cambios
        await queryRunner.rollbackTransaction();
        
        console.error("Error al eliminar persona:", error);
        
        // Provide more specific error messages
        if (error instanceof Error) {
            if (error.message.includes('foreign key constraint') && error.message.includes('work_order_technicians')) {
                res.status(400).json({ 
                    message: "No se puede eliminar el empleado porque está asignado a órdenes de trabajo",
                    details: "Complete o cancele todas las órdenes de trabajo asignadas a este empleado antes de eliminarlo."
                });
            } else {
                res.status(500).json({ 
                    message: "Error interno del servidor al eliminar empleado", 
                    error: error.message
                });
            }
        } else {
            res.status(500).json({ 
                message: "Error interno del servidor al eliminar empleado", 
                error: String(error)
            });
        }
    } finally {
        // Liberar el queryRunner
        await queryRunner.release();
    }
};
