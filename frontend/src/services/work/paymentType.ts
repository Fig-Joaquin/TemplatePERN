import api from "../../utils/axiosConfig";
import type { PaymentType } from "../../types/interfaces";

export const fetchPaymentTypes = async (): Promise<PaymentType[]> => {
  const response = await api.get("/paymentTypes");
  return response.data;
};

export const fetchPaymentTypeById = async (id: number): Promise<PaymentType> => {
  const response = await api.get(`/paymentTypes/${id}`);
  return response.data;
};

export const createPaymentType = async (paymentType: Partial<PaymentType>): Promise<PaymentType> => {
  const response = await api.post("/paymentTypes", paymentType);
  return response.data;
};

export const updatePaymentType = async (id: number, paymentType: Partial<PaymentType>): Promise<PaymentType> => {
  const response = await api.put(`/paymentTypes/${id}`, paymentType);
  return response.data;
};

export const deletePaymentType = async (id: number): Promise<void> => {
  await api.delete(`/paymentTypes/${id}`);
};