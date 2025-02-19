import api from "../utils/axiosConfig"
import type { Quotation } from "../types/interfaces"

export const fetchQuotations = async (): Promise<Quotation[]> => {
  const { data } = await api.get<Quotation[]>("/quotations")
  return data
}

export const fetchQuotationById = async (quotationId: number): Promise<Quotation> => {
  const { data } = await api.get<Quotation>(`/quotations/${quotationId}`)
  return data
}

export const createQuotation = async (quotationData: Partial<Quotation>): Promise<Quotation> => {
  const { data } = await api.post("/quotations", quotationData)
  return data
}

export const updateQuotation = async (quotationId: number, quotationData: Partial<Quotation>): Promise<Quotation> => {
  const { data } = await api.put<Quotation>(`/quotations/${quotationId}`, quotationData)
  return data
}

export const deleteQuotation = async (quotationId: number) => {
  return await api.delete(`/quotations/${quotationId}`)
}

