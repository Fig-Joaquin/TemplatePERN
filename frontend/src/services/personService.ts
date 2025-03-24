// frontend/src/services/personService.ts
import api from "../utils/axiosConfig"
import type { Person } from "../types/interfaces"

export const createPerson = async (personData: Partial<Person>) => {
  return await api.post("/persons/", personData)
}

export const updatePerson = async (personId: number, personData: Partial<Person>) => {
  return await api.put(`/persons/${personId}`, personData)
}

export const fetchPersonsClient = async () => {
  const { data } = await api.get<Person[]>("/persons")
  return data.filter((person) => person.person_type === "cliente")
}

export const fetchPersonsEmployee = async () => {
  const { data } = await api.get<Person[]>("/persons?person_type=trabajador")
  return data
}

export const getAllPersons = async (): Promise<Person[]> => {
  const response = await api.get("/persons");
  return response.data;
};

export const getTechnicians = async (): Promise<Person[]> => {
  const persons = await getAllPersons();
  return persons.filter(person => person.person_type === "trabajador");
};

export const getPersonById = async (id: number): Promise<Person> => {
  const response = await api.get(`/persons/${id}`);
  return response.data;
};

