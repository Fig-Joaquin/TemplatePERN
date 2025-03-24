import api from "../utils/axiosConfig";
import { WorkOrderTechnician } from "../types/interfaces";

export const createWorkOrderTechnician = async (data: {
  work_order_id: number;
  technician_id: number;
  status?: string;
}): Promise<WorkOrderTechnician> => {
  try {
    // Ensure we're using the correct endpoint matching backend route
    const response = await api.post("/work_order_technicians", data);
    
    // Return the workOrderTechnician object directly
    return response.data.workOrderTechnician || response.data;
  } catch (error: any) {
    console.error("Error creating work order technician:", error.response?.data || error.message);
    throw error;
  }
};

export const getWorkOrderTechnicians = async (workOrderId: number): Promise<WorkOrderTechnician[]> => {
  const response = await api.get("/work_order_technicians");
  return response.data.filter((tech: WorkOrderTechnician) => tech.workOrder?.work_order_id === workOrderId);
};
