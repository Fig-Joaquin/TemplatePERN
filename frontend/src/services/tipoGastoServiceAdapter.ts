import api from "../utils/axiosConfig";
import type { TipoGasto } from "../types/interfaces";

// Adapter functions to convert between old and new formats
const adaptExpenseTypeFromAPI = (expenseType: any): TipoGasto => {
  return {
    // New format
    expense_type_id: expenseType.expense_type_id,
    expense_type_name: expenseType.expense_type_name,
    description: expenseType.description,
    // Old format for compatibility
    id_tipo_gasto: expenseType.expense_type_id,
    nombre_tipo_gasto: expenseType.expense_type_name,
    descripcion: expenseType.description,
  };
};

const adaptExpenseTypeToAPI = (tipoGasto: Partial<TipoGasto>): any => {
  return {
    expense_type_name: tipoGasto.expense_type_name || tipoGasto.nombre_tipo_gasto,
    description: tipoGasto.description || tipoGasto.descripcion,
  };
};

export const fetchTiposGasto = async (): Promise<TipoGasto[]> => {
  const { data } = await api.get("/expense-types");
  return data.map(adaptExpenseTypeFromAPI);
};

export const fetchTipoGastoById = async (id: number): Promise<TipoGasto> => {
  const { data } = await api.get(`/expense-types/${id}`);
  return adaptExpenseTypeFromAPI(data);
};

export const createTipoGasto = async (tipoGastoData: Partial<TipoGasto>): Promise<TipoGasto> => {
  const apiData = adaptExpenseTypeToAPI(tipoGastoData);
  const { data } = await api.post("/expense-types", apiData);
  return adaptExpenseTypeFromAPI(data.expenseType || data);
};

export const updateTipoGasto = async (id: number, tipoGastoData: Partial<TipoGasto>): Promise<TipoGasto> => {
  const apiData = adaptExpenseTypeToAPI(tipoGastoData);
  const { data } = await api.put(`/expense-types/${id}`, apiData);
  return adaptExpenseTypeFromAPI(data.expenseType || data);
};

export const deleteTipoGasto = async (id: number): Promise<void> => {
  await api.delete(`/expense-types/${id}`);
};
