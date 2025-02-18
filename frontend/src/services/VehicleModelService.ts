import api from "../utils/axiosConfig"
import type { model } from "../types/interfaces"

export const fetchVehicleModels = async (): Promise<model[]> => {
    const { data } = await api.get<model[]>("/vehicleModels")
    return data
}

export const fetchVehicleModelById = async (id: number): Promise<model> => {
    const { data } = await api.get<model>(`/vehicleModels/${id}`)
    return data
}

export const createVehicleModel = async (modelData: Partial<model>): Promise<model> => {
    const { data } = await api.post<model>("/vehicleModels", modelData)
    return data
}

export const updateVehicleModel = async (id: number, modelData: Partial<model>): Promise<model> => {
    const { data } = await api.put<model>(`/vehicleModels/${id}`, modelData)
    return data
}

export const deleteVehicleModel = async (id: number): Promise<void> => {
    await api.delete(`/vehicleModels/${id}`)
}

