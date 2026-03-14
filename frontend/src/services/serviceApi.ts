import api from "../utils/axiosConfig";
import type { Service, QuotationServiceDetail, WorkOrderServiceDetail } from "@/types/service";

export interface ServicePayload {
  service_id: number;
  cantidad: number;
  precio_unitario: number;
}

export interface UpdateServicePayload {
  cantidad?: number;
  precio_unitario?: number;
}

export const getServices = async (): Promise<Service[]> => {
  try {
    const response = await api.get<Service[]>("/services");
    return response.data;
  } catch (error: any) {
    console.error("Error al obtener servicios:", error);
    throw new Error(error.response?.data?.message || "Error al obtener los servicios");
  }
};

// ─── Cotizaciones ─────────────────────────────────────────────────────────────

export const addServiceToQuotation = async (
  quotationId: number,
  data: ServicePayload
): Promise<QuotationServiceDetail> => {
  try {
    const response = await api.post<QuotationServiceDetail>(
      `/quotations/${quotationId}/services`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error("Error al agregar servicio a cotización:", error);
    throw new Error(error.response?.data?.message || "Error al agregar el servicio a la cotización");
  }
};

export const getServicesByQuotation = async (
  quotationId: number
): Promise<QuotationServiceDetail[]> => {
  try {
    const response = await api.get<QuotationServiceDetail[]>(
      `/quotations/${quotationId}/services`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error al obtener servicios de cotización:", error);
    return [];
  }
};

export const updateQuotationService = async (
  detailId: number,
  data: UpdateServicePayload
): Promise<QuotationServiceDetail> => {
  try {
    const response = await api.put<QuotationServiceDetail>(
      `/quotation-services/${detailId}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error("Error al actualizar servicio de cotización:", error);
    throw new Error(error.response?.data?.message || "Error al actualizar el servicio");
  }
};

export const deleteQuotationService = async (detailId: number): Promise<void> => {
  try {
    await api.delete(`/quotation-services/${detailId}`);
  } catch (error: any) {
    console.error("Error al eliminar servicio de cotización:", error);
    throw new Error(error.response?.data?.message || "Error al eliminar el servicio");
  }
};

// ─── Órdenes de trabajo ───────────────────────────────────────────────────────

export const addServiceToWorkOrder = async (
  workOrderId: number,
  data: ServicePayload
): Promise<WorkOrderServiceDetail> => {
  try {
    const response = await api.post<WorkOrderServiceDetail>(
      `/workOrders/${workOrderId}/services`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error("Error al agregar servicio a orden de trabajo:", error);
    throw new Error(error.response?.data?.message || "Error al agregar el servicio a la orden de trabajo");
  }
};

export const getServicesByWorkOrder = async (
  workOrderId: number
): Promise<WorkOrderServiceDetail[]> => {
  try {
    const response = await api.get<WorkOrderServiceDetail[]>(
      `/workOrders/${workOrderId}/services`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error al obtener servicios de orden de trabajo:", error);
    return [];
  }
};

export const updateWorkOrderService = async (
  detailId: number,
  data: UpdateServicePayload
): Promise<WorkOrderServiceDetail> => {
  try {
    const response = await api.put<WorkOrderServiceDetail>(
      `/work-order-services/${detailId}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error("Error al actualizar servicio de orden de trabajo:", error);
    throw new Error(error.response?.data?.message || "Error al actualizar el servicio");
  }
};

export const deleteWorkOrderService = async (detailId: number): Promise<void> => {
  try {
    await api.delete(`/work-order-services/${detailId}`);
  } catch (error: any) {
    console.error("Error al eliminar servicio de orden de trabajo:", error);
    throw new Error(error.response?.data?.message || "Error al eliminar el servicio");
  }
};
