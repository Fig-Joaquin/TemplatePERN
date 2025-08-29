import api from "../utils/axiosConfig";
import type { Gasto } from "../types/interfaces";

// Adapter functions to convert between old and new formats
const adaptExpenseFromAPI = (expense: any): Gasto => {
  return {
    company_expense_id: expense.company_expense_id,
    expense_type: {
      expense_type_id: expense.expense_type?.expense_type_id,
      expense_type_name: expense.expense_type?.expense_type_name || "",
      description: expense.expense_type?.description,
    },
    description: expense.description,
    amount: expense.amount,
    expense_date: expense.expense_date,
    receipt_number: expense.receipt_number,
  };
};

const adaptExpenseToAPI = (gasto: Partial<Gasto>): any => {
  // Get expense_type_id from the expense_type object
  const expenseTypeId = gasto.expense_type?.expense_type_id;
  
  if (!expenseTypeId) {
    console.error("No expense_type_id found in gasto object", gasto);
  }
  
  return {
    expense_type_id: expenseTypeId,
    description: gasto.description,
    amount: gasto.amount,
    expense_date: gasto.expense_date,
    receipt_number: gasto.receipt_number,
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
