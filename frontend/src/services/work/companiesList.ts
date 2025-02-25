// src/services/companyService.ts
import api from "../../utils/axiosConfig";
import type { Company, Vehicle } from "../../types/interfaces";

export const fetchCompanies = async (): Promise<Company[]> => {
  const response = await api.get(`/companies`);
  return response.data;
};

export const createCompany = async (data: Partial<Company>): Promise<Company> => {
  const response = await api.post(`/companies`, data);
  return response.data;
};

export const updateCompany = async (companyId: number, data: Partial<Company>): Promise<Company> => {
  const response = await api.put(`/companies/${companyId}`, data);
  return response.data;
};

export const deleteCompany = async (companyId: number): Promise<void> => {
  await api.delete(`/companies/${companyId}`);
};
