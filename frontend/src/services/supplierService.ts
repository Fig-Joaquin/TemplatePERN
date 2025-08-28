import api from "../utils/axiosConfig"
import type { Supplier } from "../types/interfaces"

export const fetchSuppliers = async () => {
  const { data } = await api.get<Supplier[]>("/suppliers")
  return data
}

export const fetchSupplierById = async (supplierId: number) => {
  const { data } = await api.get<Supplier>(`/suppliers/${supplierId}`)
  return data
}

export const createSupplier = async (supplierData: Partial<Supplier>) => {
  const { data } = await api.post<Supplier>("/suppliers", supplierData)
  return data
}

export const updateSupplier = async (supplierId: number, supplierData: Partial<Supplier>) => {
  const { data } = await api.put<Supplier>(`/suppliers/${supplierId}`, supplierData)
  return data
}

export const deleteSupplier = async (supplierId: number) => {
  const { data } = await api.delete(`/suppliers/${supplierId}`)
  return data
}
