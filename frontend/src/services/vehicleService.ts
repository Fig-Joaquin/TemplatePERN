import api from "../utils/axiosConfig"
import type { Vehicle } from "../types/interfaces"

export const fetchVehicles = async () => {
  const { data } = await api.get<Vehicle[]>("/vehicles")
  return data
}

export const createVehicle = async (vehicleData: Partial<Vehicle>) => {
  return await api.post("/vehicles", vehicleData)
}

export const updateVehicle = async (vehicleId: number, vehicleData: Partial<Vehicle>) => {
  try {
    // Ensure we're sending a clean object without nested properties
    const cleanedData = {
      ...vehicleData,
      // Remove any nested properties that might cause issues, pero conservar mileageHistory
      model: undefined,
      owner: undefined,
      company: undefined,
      mileage_history: undefined
      // mileageHistory se mantiene para enviar al backend
    };
    
    const { data } = await api.put<Vehicle>(`/vehicles/${vehicleId}`, cleanedData)
    return data
  } catch (error) {
    console.error("Error updating vehicle:", error);
    throw error;
  }
}

export const deleteVehicle = async (vehicleId: number) => {
  return await api.delete(`/vehicles/${vehicleId}`)
}

export const fetchVehicleId = async (vehicleId: number) => {
  const { data } = await api.get<Vehicle>(`/vehicles/${vehicleId}`)
  return data
}

export const fetchVehiclesByPersonId = async (personId: number) => {
  const { data } = await api.get<Vehicle[]>(`/vehicles/person/${personId}`)
  return data
}

export const fetchVehicleByLicensePlate = async (licensePlate: string) => {
  const { data } = await api.get<Vehicle>(`/vehicles/license/${licensePlate}`)
  return data
}

