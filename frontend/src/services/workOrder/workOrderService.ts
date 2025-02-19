import api from "../../utils/axiosConfig";
import type { WorkOrder, WorkOrderInput } from "../../types/interfaces";

/**
 * Obtiene todas las órdenes de trabajo.
 * @returns {Promise<WorkOrder[]>} Lista de órdenes de trabajo.
 */
export const getAllWorkOrders = async (): Promise<WorkOrder[]> => {
    try {
        const response = await api.get<WorkOrder[]>("/work_orders");
        return response.data;
    } catch (error: any) {
        console.error("Error al obtener órdenes de trabajo:", error);
        throw new Error(error.response?.data?.message || "No se pudieron cargar las órdenes de trabajo.");
    }
};

/**
 * Obtiene una orden de trabajo por ID.
 * @param {number} workOrderId - ID de la orden.
 * @returns {Promise<WorkOrder>} Orden de trabajo encontrada.
 */
export const getWorkOrderById = async (workOrderId: number): Promise<WorkOrder> => {
    try {
        const response = await api.get<WorkOrder>(`/work_orders/${workOrderId}`);
        return response.data;
    } catch (error: any) {
        console.error(`Error al obtener orden de trabajo ${workOrderId}:`, error);
        throw new Error(error.response?.data?.message || "Orden de trabajo no encontrada.");
    }
};

/**
 * Crea una nueva orden de trabajo.
 * @param {WorkOrderInput} workOrderData - Datos de la nueva orden.
 * @returns {Promise<WorkOrder>} Orden de trabajo creada.
 */
export const createWorkOrder = async (workOrderData: WorkOrderInput): Promise<WorkOrder> => {
    try {
        const response = await api.post<WorkOrder>("/work_orders", workOrderData);
        return response.data;
    } catch (error: any) {
        console.error("Error al crear orden de trabajo:", error);
        throw new Error(error.response?.data?.message || "Error al crear la orden de trabajo.");
    }
};

/**
 * Actualiza una orden de trabajo existente.
 * @param {number} workOrderId - ID de la orden.
 * @param {Partial<WorkOrderInput>} workOrderData - Datos a actualizar.
 * @returns {Promise<WorkOrder>} Orden de trabajo actualizada.
 */
export const updateWorkOrder = async (workOrderId: number, workOrderData: Partial<WorkOrderInput>): Promise<WorkOrder> => {
    try {
        const response = await api.put<WorkOrder>(`/work_orders/${workOrderId}`, workOrderData);
        return response.data;
    } catch (error: any) {
        console.error(`Error al actualizar orden de trabajo ${workOrderId}:`, error);
        throw new Error(error.response?.data?.message || "Error al actualizar la orden de trabajo.");
    }
};

/**
 * Elimina una orden de trabajo.
 * @param {number} workOrderId - ID de la orden a eliminar.
 * @returns {Promise<void>}
 */
export const deleteWorkOrder = async (workOrderId: number): Promise<void> => {
    try {
        await api.delete(`/work_orders/${workOrderId}`);
    } catch (error: any) {
        console.error(`Error al eliminar orden de trabajo ${workOrderId}:`, error);
        throw new Error(error.response?.data?.message || "Error al eliminar la orden de trabajo.");
    }
};
