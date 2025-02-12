import api from "../utils/axiosConfig";
import { WorkProductDetail } from "../types/interfaces";

const API_URL = "/workProductDetails";

export const getAllWorkProductDetails = async () => {
    const response = await api.get(API_URL);
    return response.data;
};

export const getWorkProductDetailsByQuotationId = async (quotationId: number) => {
    const response = await api.get(`${API_URL}/quotation/${quotationId}`);
    return response.data;
};

export const getWorkProductDetailById = async (id: number) => {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
};

export const createWorkProductDetail = async (data: WorkProductDetail) => {
    const response = await api.post(API_URL, data);
    return response.data;
};

export const updateWorkProductDetail = async (id: number, data: Partial<WorkProductDetail>) => {
    const response = await api.put(`${API_URL}/${id}`, data);
    return response.data;
};

export const deleteWorkProductDetail = async (id: number) => {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
};