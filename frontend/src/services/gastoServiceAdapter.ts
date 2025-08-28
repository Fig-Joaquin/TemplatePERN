import api from "../utils/axiosConfig";
import type { Gasto } from "../types/interfaces";

// Adapter functions to convert between old and new formats
const adaptExpenseFromAPI = (expense: any): Gasto => {
  return {
    // New format
    company_expense_id: expense.company_expense_id,
    expense_type: {
      expense_type_id: expense.expense_type?.expense_type_id,
      expense_type_name: expense.expense_type?.expense_type_name || "",
      description: expense.expense_type?.description,
      // Old format for compatibility
      id_tipo_gasto: expense.expense_type?.expense_type_id,
      nombre_tipo_gasto: expense.expense_type?.expense_type_name,
      descripcion: expense.expense_type?.description,
    },
    description: expense.description,
    amount: expense.amount,
    expense_date: expense.expense_date,
    receipt_number: expense.receipt_number,
    // Old format for compatibility
    id_gasto_empresa: expense.company_expense_id,
    tipo_gasto: {
      expense_type_name: expense.expense_type?.expense_type_name || "",
      id_tipo_gasto: expense.expense_type?.expense_type_id,
      nombre_tipo_gasto: expense.expense_type?.expense_type_name,
      descripcion: expense.expense_type?.description,
    },
    descripcion: expense.description,
    monto: expense.amount,
    fecha_gasto: expense.expense_date,
    numero_boleta: expense.receipt_number,
  };
};

const adaptExpenseToAPI = (gasto: Partial<Gasto>): any => {
  // Support both old and new field names
  const expenseTypeId = gasto.expense_type?.expense_type_id || 
                       gasto.tipo_gasto?.id_tipo_gasto ||
                       gasto.expense_type?.id_tipo_gasto;
  
  return {
    expense_type_id: expenseTypeId,
    description: gasto.description || gasto.descripcion,
    amount: gasto.amount || gasto.monto,
    expense_date: gasto.expense_date || gasto.fecha_gasto,
    receipt_number: gasto.receipt_number || gasto.numero_boleta,
  };
};

export const fetchGastos = async (): Promise<Gasto[]> => {
  const { data } = await api.get("/company-expenses");
  return data.map(adaptExpenseFromAPI);
};

export const fetchGastoById = async (id: number): Promise<Gasto> => {
  const { data } = await api.get(`/company-expenses/${id}`);
  return adaptExpenseFromAPI(data);
};

export const createGasto = async (gastoData: Partial<Gasto>): Promise<Gasto> => {
  const apiData = adaptExpenseToAPI(gastoData);
  const { data } = await api.post("/company-expenses", apiData);
  return adaptExpenseFromAPI(data.expense || data);
};

export const updateGasto = async (id: number, gastoData: Partial<Gasto>): Promise<Gasto> => {
  const apiData = adaptExpenseToAPI(gastoData);
  const { data } = await api.put(`/company-expenses/${id}`, apiData);
  return adaptExpenseFromAPI(data.expense || data);
};

export const deleteGasto = async (id: number): Promise<void> => {
  await api.delete(`/company-expenses/${id}`);
};
