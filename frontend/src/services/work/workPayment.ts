import api from "../../utils/axiosConfig";
import type { WorkPayment } from "../../types/interfaces";

export const fetchWorkPayments = async (): Promise<WorkPayment[]> => {
  const response = await api.get("/workPayments");
  return response.data;
};

export const fetchWorkPaymentById = async (id: number): Promise<WorkPayment> => {
  const response = await api.get(`/workPayments/${id}`);
  return response.data;
};

export const createWorkPayment = async (workPayment: Partial<WorkPayment>): Promise<WorkPayment> => {
  const response = await api.post("/workPayments", workPayment);
  return response.data;
};

export const updateWorkPayment = async (id: number, workPayment: Partial<WorkPayment>): Promise<WorkPayment> => {
  const response = await api.put(`/workPayments/${id}`, workPayment);
  return response.data;
};

export const deleteWorkPayment = async (id: number): Promise<void> => {
  await api.delete(`/workPayments/${id}`);
};