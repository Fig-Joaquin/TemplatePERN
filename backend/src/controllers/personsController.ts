// src/controllers/personController.ts
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/ormconfig";
import { Person } from "../entities/personsEntity";
import { PersonSchema, UpdatePersonSchema } from "../schema/personsValidator";

const personRepository = AppDataSource.getRepository(Person);

export const getAllPersons = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const persons = await personRepository.find();
        res.json(persons);
        return;
    } catch (error) {
        res.status(500).json({ message: "Error al obtener personas", error });
        return;
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
        const validationResult = PersonSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ errors: validationResult.error.errors });
            return;
        }

        const person = personRepository.create(req.body);
        await personRepository.save(person);
        res.status(201).json(person);
        return;
    } catch (error: any) {
        if (error.code === '23505') { // Unique constraint error
            res.status(400).json({ message: "El RUT ya existe en el sistema" });
            return;
        }
        res.status(500).json({ message: "Error al crear persona", error });
        return;
    }
};

export const updatePerson = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
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
    } catch (error: any) {
        if (error.code === '23505') {
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
