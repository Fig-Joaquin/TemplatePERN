import api from "../utils/axiosConfig"
import type { WorkOrder } from "../types/interfaces"

export const getAllWorkOrders = async () => {
  const response = await api.get("/work_orders")
  return response.data
}

export const getWorkOrderById = async (workOrderId: number) => {
  const response = await api.get(`/work_orders/${workOrderId}`)
  return response.data
}

export const createWorkOrder = async (workOrderData: WorkOrder) => {
  const response = await api.post("/work_orders", workOrderData)
  return response.data
}

export const updateWorkOrder = async (workOrderId: number, workOrderData: Partial<WorkOrder>) => {
  const response = await api.put(`/work_orders/${workOrderId}`, workOrderData)
  return response.data
}

export const deleteWorkOrder = async (workOrderId: number) => {
  const response = await api.delete(`/work_orders/${workOrderId}`)
  return response.data
}

