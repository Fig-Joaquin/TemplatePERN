import api from "../utils/axiosConfig";
import { WorkProductDetail } from "@/types/interfaces";

/**
 * Gets all work product details
 * @returns {Promise<WorkProductDetail[]>} List of all product details
 */
export const getAllWorkProductDetails = async (): Promise<WorkProductDetail[]> => {
  try {
    const response = await api.get<WorkProductDetail[]>("/workProductDetails");
    return response.data;
  } catch (error: any) {
    console.error("Error al obtener detalles de productos:", error);
    throw new Error(error.response?.data?.message || "Error al obtener los detalles de productos");
  }
};

/**
 * Gets work product details by quotation ID
 * @param {number} quotationId - The quotation ID
 * @returns {Promise<WorkProductDetail[]>} List of product details for the quotation
 */
export const getWorkProductDetailsByQuotationId = async (quotationId: number): Promise<WorkProductDetail[]> => {
  try {
    const response = await api.get<WorkProductDetail[]>(`/workProductDetails/quotation/${quotationId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error al obtener detalles por cotización ${quotationId}:`, error);
    return [];
  }
};

/**
 * Gets work product details by work order ID
 * @param {number} workOrderId - The work order ID
 * @returns {Promise<WorkProductDetail[]>} List of product details for the work order
 */
export const getWorkProductDetailsByWorkOrderId = async (workOrderId: number): Promise<WorkProductDetail[]> => {
  try {
    const response = await api.get<WorkProductDetail[]>(`/workProductDetails/workorder/${workOrderId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error al obtener detalles por orden ${workOrderId}:`, error);
    return [];
  }
};

/**
 * Creates a new work product detail (product in a work order)
 * @param {Partial<WorkProductDetail>} detailData - The product detail data
 * @returns {Promise<WorkProductDetail>} The created product detail
 */
export const createWorkProductDetail = async (detailData: Partial<WorkProductDetail>): Promise<WorkProductDetail> => {
  try {
    const response = await api.post<WorkProductDetail>("/workProductDetails", detailData);
    return response.data;
  } catch (error: any) {
    console.error("Error al crear detalle de producto:", error);
    throw new Error(error.response?.data?.message || "Error al agregar el producto a la orden");
  }
};

/**
 * Deletes a work product detail by ID
 * @param {number} detailId - The detail ID to delete
 * @returns {Promise<void>}
 */
export const deleteWorkProductDetail = async (detailId: number): Promise<void> => {
  try {
    await api.delete(`/workProductDetails/${detailId}`);
  } catch (error: any) {
    console.error(`Error al eliminar detalle de producto ${detailId}:`, error);
    throw new Error(error.response?.data?.message || "Error al eliminar el producto de la orden");
  }
};

/**
 * Updates a work product detail
 * @param {number} detailId - The detail ID to update
 * @param {Partial<WorkProductDetail>} detailData - The updated detail data
 * @returns {Promise<WorkProductDetail>} The updated product detail
 */
export const updateWorkProductDetail = async (
  detailId: number, 
  detailData: Partial<WorkProductDetail>
): Promise<WorkProductDetail> => {
  try {
    const response = await api.put<WorkProductDetail>(`/workProductDetails/${detailId}`, detailData);
    return response.data;
  } catch (error: any) {
    console.error(`Error al actualizar detalle de producto ${detailId}:`, error);
    throw new Error(error.response?.data?.message || "Error al actualizar el producto en la orden");
  }
};
