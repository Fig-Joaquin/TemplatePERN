// src/controllers/personController.ts
/* eslint-disable no-console */
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/ormconfig";
import { Person } from "../entities/personsEntity";
import { PersonSchema, UpdatePersonSchema } from "../schema/personsValidator";

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

export const updatePerson = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        console.log(req.body);
        const { id } = req.params;
        const person = await personRepository.findOneBy({ person_id: parseInt(id) });
        
        if (!person) {
            res.status(404).json({ message: "Persona no encontrada" });
            return;
        }

        const validationResult = UpdatePersonSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ errors: validationResult.error.errors });
            return;
        }

        personRepository.merge(person, req.body);
        await personRepository.save(person);
        res.json(person);
        return;
    } catch (error: unknown) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
            res.status(400).json({ message: "El RUT ya existe en el sistema" });
            return;
        }
        res.status(500).json({ message: "Error al actualizar persona", error });
        return;
    }
};

export const deletePerson = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        
        // Delete associated mileage_history for the vehicles of the person
        await AppDataSource.createQueryBuilder()
            .delete()
            .from("mileage_history")
            .where("vehicle_id IN (SELECT vehicle_id FROM vehicles WHERE person_id = :id)", { id: parseInt(id) })
            .execute();
        
        // Delete associated vehicles
        await AppDataSource.createQueryBuilder()
            .delete()
            .from("vehicles")
            .where("person_id = :id", { id: parseInt(id) })
            .execute();
        
        const result = await personRepository.delete(parseInt(id));
        
        if (result.affected === 0) {
            res.status(404).json({ message: "Persona no encontrada" });
            return;
        }

        res.status(204).send();
        return;
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar persona", error });
        return;
    }
};
