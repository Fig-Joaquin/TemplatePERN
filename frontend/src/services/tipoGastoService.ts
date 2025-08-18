import api from "../utils/axiosConfig";
import type { TipoGasto } from "../types/interfaces";

export const fetchTiposGasto = async (): Promise<TipoGasto[]> => {
  const { data } = await api.get("/expense-types");
  return data;
};

export const fetchTipoGastoById = async (id: number): Promise<TipoGasto> => {
  const { data } = await api.get(`/expense-types/${id}`);
  return data;
};

export const createTipoGasto = async (tipoGastoData: Partial<TipoGasto>): Promise<TipoGasto> => {
  const { data } = await api.post("/expense-types", tipoGastoData);
  return data;
};

export const updateTipoGasto = async (id: number, tipoGastoData: Partial<TipoGasto>): Promise<TipoGasto> => {
  const { data } = await api.put(`/expense-types/${id}`, tipoGastoData);
  return data;
};

export const deleteTipoGasto = async (id: number): Promise<void> => {
  await api.delete(`/expense-types/${id}`);
};