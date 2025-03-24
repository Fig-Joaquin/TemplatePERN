import api from "../utils/axiosConfig";
import type { WorkProductDetail } from "../types/interfaces";

export const createWorkProductDetail = async (detailData: Partial<WorkProductDetail>): Promise<WorkProductDetail> => {
  try {
    const { data } = await api.post<WorkProductDetail>("/workProductDetails", detailData);
    return data;
  } catch (error: any) {
    console.error("Error creating work product detail:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Error al crear el detalle del producto");
  }
};
