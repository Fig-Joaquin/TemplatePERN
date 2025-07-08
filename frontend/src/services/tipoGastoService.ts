import api from "../utils/axiosConfig";
import type { TipoGasto } from "../types/interfaces";

export const fetchTiposGasto = async (): Promise<TipoGasto[]> => {
  const { data } = await api.get("/tiposGasto");
  return data;
};

export const fetchTipoGastoById = async (id: number): Promise<TipoGasto> => {
  const { data } = await api.get(`/tiposGasto/${id}`);
  return data;
};

export const createTipoGasto = async (tipoGastoData: Partial<TipoGasto>): Promise<TipoGasto> => {
  const { data } = await api.post("/tiposGasto", tipoGastoData);
  return data;
};

export const updateTipoGasto = async (id: number, tipoGastoData: Partial<TipoGasto>): Promise<TipoGasto> => {
  const { data } = await api.put(`/tiposGasto/${id}`, tipoGastoData);
  return data;
};

export const deleteTipoGasto = async (id: number): Promise<void> => {
  await api.delete(`/tiposGasto/${id}`);
};