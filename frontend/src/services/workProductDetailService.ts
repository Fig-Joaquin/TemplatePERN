import api from "../utils/axiosConfig";
import { WorkProductDetail } from "@/types/interfaces";

/**
 * Creates a new work product detail (product in a work order)
 * @param {Partial<WorkProductDetail>} detailData - The product detail data
 * @returns {Promise<WorkProductDetail>} The created product detail
 */
export const createWorkProductDetail = async (detailData: Partial<WorkProductDetail>): Promise<WorkProductDetail> => {
  try {
    const response = await api.post<WorkProductDetail>("/work_product_details", detailData);
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
    await api.delete(`/work_product_details/${detailId}`);
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
    const response = await api.put<WorkProductDetail>(`/work_product_details/${detailId}`, detailData);
    return response.data;
  } catch (error: any) {
    console.error(`Error al actualizar detalle de producto ${detailId}:`, error);
    throw new Error(error.response?.data?.message || "Error al actualizar el producto en la orden");
  }
};
