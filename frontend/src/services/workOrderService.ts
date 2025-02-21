import api from "../utils/axiosConfig";
import { WorkOrder, WorkOrderInput } from "../types/interfaces";

export const getAllWorkOrders = async (): Promise<WorkOrder[]> => {
  const response = await api.get("/workOrders");
  return response.data;
};

export const getWorkOrderById = async (id: number): Promise<WorkOrder> => {
  const response = await api.get(`/workOrders/${id}`);
  return response.data;
};

export const fetchWorkOrders = async (): Promise<WorkOrder[]> => {
  const { data } = await api.get<WorkOrder[]>("/workOrders");
  return data;
};

export const createWorkOrder = async (workOrderData: Partial<WorkOrderInput>): Promise<WorkOrder> => {
  const { data } = await api.post<WorkOrder>("/workorders", workOrderData);
  return data;
};

export const updateWorkOrder = async (workOrderId: number, workOrderData: Partial<WorkOrderInput>): Promise<WorkOrder> => {
  const { data } = await api.put<WorkOrder>(`/workOrders/${workOrderId}`, workOrderData);
  return data;
};

export const deleteWorkOrder = async (workOrderId: number) => {
  await api.delete(`/workOrders/${workOrderId}`);
};
