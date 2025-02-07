import api from "../utils/axiosConfig";
import { Vehicle } from "../components/vehicleList";

export const fetchVehicles = async () => {
    const { data } = await api.get<Vehicle[]>("/vehicles");
    return data;
};

export const createVehicle = async (vehicleData: Partial<Vehicle>) => {
    return await api.post("/vehicles", vehicleData);
};

export const updateVehicle = async (vehicleId: number, vehicleData: Partial<Vehicle>) => {
    return await api.put(`/vehicles/${vehicleId}`, vehicleData);
};

export const deleteVehicle = async (vehicleId: number) => {
    return await api.delete(`/vehicles/${vehicleId}`);
};

export const fetchVehicleId = async (vehicleId: number) => {
    const { data } = await api.get<Vehicle>(`/vehicles/${vehicleId}`);
    return data;
};

export const fetchVehiclesByPersonId = async (personId: number) => {
    const { data } = await api.get<Vehicle[]>(`/vehicles/person/${personId}`);
    return data;
}