import api from "../utils/axiosConfig";
import type { WorkProductDetail } from "../types/interfaces";

/**
 * Obtiene todos los detalles de productos
 */
export const getAllWorkProductDetails = async (): Promise<WorkProductDetail[]> => {
  const response = await api.get("/workProductDetails");
  return response.data;
};

/**
 * Obtiene un detalle de producto por ID
 */
export const getWorkProductDetailById = async (id: number): Promise<WorkProductDetail> => {
  const response = await api.get(`/workProductDetails/${id}`);
  return response.data;
};

/**
 * Obtiene detalles de productos por ID de cotización
 */
export const getWorkProductDetailsByQuotationId = async (quotationId: number): Promise<WorkProductDetail[]> => {
  try {
    const response = await api.get(`/workProductDetails/quotation/${quotationId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product details for quotation ${quotationId}:`, error);
    return [];
  }
};

/**
 * Obtiene detalles de productos por ID de orden de trabajo
 */
export const getWorkProductDetailsByWorkOrderId = async (workOrderId: number): Promise<WorkProductDetail[]> => {
  try {
    const response = await api.get(`/workProductDetails/workorder/${workOrderId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product details for work order ${workOrderId}:`, error);
    return [];
  }
};

/**
 * Crea un nuevo detalle de producto
 */
export const createWorkProductDetail = async (workProductDetail: WorkProductDetail): Promise<WorkProductDetail> => {
  const response = await api.post("/workProductDetails", workProductDetail);
  return response.data;
};

/**
 * Actualiza un detalle de producto existente
 */
export const updateWorkProductDetail = async (id: number, workProductDetail: Partial<WorkProductDetail>): Promise<WorkProductDetail> => {
  const response = await api.put(`/workProductDetails/${id}`, workProductDetail);
  return response.data;
};

/**
 * Elimina un detalle de producto
 */
export const deleteWorkProductDetail = async (id: number): Promise<void> => {
  await api.delete(`/workProductDetails/${id}`);
};

