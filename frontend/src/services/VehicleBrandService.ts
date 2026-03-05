import api from "../utils/axiosConfig"
import type { Brand } from "../types/interfaces"

export const fetchVehicleBrands = async (): Promise<Brand[]> => {
  const { data } = await api.get<Brand[]>("/vehicleBrands")
  return data
}

export const fetchVehicleBrandById = async (id: number): Promise<Brand> => {
  const { data } = await api.get<Brand>(`/vehicleBrands/${id}`)
  return data
}

export const createVehicleBrand = async (brandData: Partial<Brand>): Promise<Brand> => {
  const { data } = await api.post<Brand>("/vehicleBrands", brandData)
  return data
}

export const updateVehicleBrand = async (id: number, brandData: Partial<Brand>): Promise<Brand> => {
  const { data } = await api.put<Brand>(`/vehicleBrands/${id}`, brandData)
  return data
}

export const deleteVehicleBrand = async (id: number): Promise<void> => {
  await api.delete(`/vehicleBrands/${id}`)
}

