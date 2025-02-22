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

// frontend/src/services/quotationService.ts
export const downloadQuotationPDF = async (quotationId: number) => {
  try {
    const response = await api.get(`/quotations/pdf/${quotationId}`, {
      responseType: 'blob'
    });
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cotizacion-${quotationId}.pdf`);
    
    // Append to html page
    document.body.appendChild(link);
    link.click();
    
    // Clean up and remove the link
    link.parentNode?.removeChild(link);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
};

