import { Request, Response } from "express";
import { AppDataSource } from "../config/ormconfig";
import { Person } from "../entities/personsEntity";
import { PersonSchema, UpdatePersonSchema } from "../schema/personsValidator";

const personRepository = AppDataSource.getRepository(Person);

export const getAllPersons = async (_req: Request, res: Response) => {
    try {
        const persons = await personRepository.find();
        return res.json(persons);
    } catch (error) {
        return res.status(500).json({ message: "Error al obtener personas", error });
    }
};

export const getPersonById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const person = await personRepository.findOneBy({ person_id: parseInt(id) });
        
        if (!person) {
            return res.status(404).json({ message: "Persona no encontrada" });
        }
        
        return res.json(person);
    } catch (error) {
        return res.status(500).json({ message: "Error al obtener persona", error });
    }
};

export const createPerson = async (req: Request, res: Response) => {
    try {
        const validationResult = PersonSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({ errors: validationResult.error.errors });
        }

        const person = personRepository.create(req.body);
        await personRepository.save(person);
        return res.status(201).json(person);
    } catch (error: any) {
        if (error.code === '23505') { // Unique constraint error
            return res.status(400).json({ message: "El RUT ya existe en el sistema" });
        }
        return res.status(500).json({ message: "Error al crear persona", error });
    }
};

export const updatePerson = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const person = await personRepository.findOneBy({ person_id: parseInt(id) });
        
        if (!person) {
            return res.status(404).json({ message: "Persona no encontrada" });
        }

        const validationResult = UpdatePersonSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({ errors: validationResult.error.errors });
        }

        personRepository.merge(person, req.body);
        await personRepository.save(person);
        return res.json(person);
    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(400).json({ message: "El RUT ya existe en el sistema" });
        }
        return res.status(500).json({ message: "Error al actualizar persona", error });
    }
};

export const deletePerson = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await personRepository.delete(parseInt(id));
        
        if (result.affected === 0) {
            return res.status(404).json({ message: "Persona no encontrada" });
        }

        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ message: "Error al eliminar persona", error });
    }
};
