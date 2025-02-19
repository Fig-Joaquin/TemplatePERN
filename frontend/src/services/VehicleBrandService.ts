import api from "../utils/axiosConfig"
import type { brand } from "../types/interfaces"

export const fetchVehicleBrands = async (): Promise<brand[]> => {
  const { data } = await api.get<brand[]>("/vehicleBrands")
  return data
}

export const fetchVehicleBrandById = async (id: number): Promise<brand> => {
  const { data } = await api.get<brand>(`/vehicleBrands/${id}`)
  return data
}

export const createVehicleBrand = async (brandData: Partial<brand>): Promise<brand> => {
  const { data } = await api.post<brand>("/vehicleBrands", brandData)
  return data
}

export const updateVehicleBrand = async (id: number, brandData: Partial<brand>): Promise<brand> => {
  const { data } = await api.put<brand>(`/vehicleBrands/${id}`, brandData)
  return data
}

export const deleteVehicleBrand = async (id: number): Promise<void> => {
  await api.delete(`/vehicleBrands/${id}`)
}

