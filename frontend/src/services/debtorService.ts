import api from "../utils/axiosConfig";
import { Debtor, DebtorInput, PaymentInput } from "../types/interfaces";

export const getAllDebtors = async (): Promise<Debtor[]> => {
  try {
    console.log("Llamando a API de deudores..."); // Debug
    const response = await api.get("/debtors");
    console.log("Respuesta de API de deudores:", response.data); // Debug
    
    // Filtrar deudores pagados para que no aparezcan en la lista
    const unpaidDebtors = response.data.filter((debtor: Debtor) => 
      debtor.payment_status !== "pagado"
    );
    
    return unpaidDebtors;
  } catch (error) {
    console.error("Error en getAllDebtors:", error); // Debug
    throw error;
  }
};

export const getDebtorById = async (id: number): Promise<Debtor> => {
  const response = await api.get(`/debtors/${id}`);
  return response.data;
};

export const createDebtor = async (debtorData: DebtorInput): Promise<Debtor> => {
  const response = await api.post("/debtors", debtorData);
  return response.data.debtor || response.data;
};

export const updateDebtor = async (id: number, debtorData: Partial<DebtorInput>): Promise<Debtor> => {
  const response = await api.put(`/debtors/${id}`, debtorData);
  return response.data.debtor || response.data;
};

export const deleteDebtor = async (id: number): Promise<any> => {
  const response = await api.delete(`/debtors/${id}`);
  return response;
};

export const processPayment = async (id: number, paymentData: PaymentInput): Promise<any> => {
  const response = await api.post(`/debtors/${id}/payment`, paymentData);
  return response.data;
};

// Función adicional para obtener deudores por orden de trabajo
export const getDebtorsByWorkOrder = async (workOrderId: number): Promise<Debtor[]> => {
  const response = await api.get(`/debtors/work-order/${workOrderId}`);
  return response.data;
};
