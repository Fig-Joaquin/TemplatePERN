import api from "../utils/axiosConfig";
import type { WorkProductDetail } from "../types/interfaces";

export const createWorkProductDetail = async (detailData: Partial<WorkProductDetail>): Promise<WorkProductDetail> => {
  const { data } = await api.post<WorkProductDetail>("/workProductDetails", detailData);
  return data;
};
