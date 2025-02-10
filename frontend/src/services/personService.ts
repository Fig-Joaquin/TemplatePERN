// frontend/src/services/personService.ts
import api from "../utils/axiosConfig";
import { Person } from "../types/interfaces";

export const createPerson = async (personData: Partial<Person>) => {
    return await api.post("/persons/", personData);
};

export const updatePerson = async (personId: number, personData: Partial<Person>) => {
    return await api.put(`/persons/${personId}`, personData);
};

export const fetchPersonsClient = async () => {
    const { data } = await api.get<Person[]>("/persons");
    return data.filter(person => person.person_type === "cliente");
};