import api from "../utils/axiosConfig"
import type { Model } from "../types/interfaces"

export const fetchVehicleModels = async (): Promise<Model[]> => {
  const { data } = await api.get<Model[]>("/vehicleModels")
  return data
}

export const fetchVehicleModelById = async (id: number): Promise<Model> => {
  const { data } = await api.get<Model>(`/vehicleModels/${id}`)
  return data
}

export const createVehicleModel = async (modelData: Partial<Model>): Promise<Model> => {
  const { data } = await api.post<Model>("/vehicleModels", modelData)
  return data
}

export const updateVehicleModel = async (id: number, modelData: Partial<Model>): Promise<Model> => {
  const { data } = await api.put<Model>(`/vehicleModels/${id}`, modelData)
  return data
}

export const deleteVehicleModel = async (id: number): Promise<void> => {
  await api.delete(`/vehicleModels/${id}`)
}

