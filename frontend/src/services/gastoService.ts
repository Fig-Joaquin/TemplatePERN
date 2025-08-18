import api from "../utils/axiosConfig";
import type { Gasto } from "../types/interfaces";

export const fetchGastos = async (): Promise<Gasto[]> => {
  const { data } = await api.get("/company-expenses");
  return data;
};

export const fetchGastoById = async (id: number): Promise<Gasto> => {
  const { data } = await api.get(`/company-expenses/${id}`);
  return data;
};

export const createGasto = async (gastoData: Partial<Gasto>): Promise<Gasto> => {
  const { data } = await api.post("/company-expenses", gastoData);
  return data;
};

export const updateGasto = async (id: number, gastoData: Partial<Gasto>): Promise<Gasto> => {
  const { data } = await api.put(`/company-expenses/${id}`, gastoData);
  return data;
};

export const deleteGasto = async (id: number): Promise<void> => {
  await api.delete(`/company-expenses/${id}`);
};