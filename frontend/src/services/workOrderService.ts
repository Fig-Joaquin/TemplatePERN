import api from "../utils/axiosConfig";
import { WorkOrder, WorkOrderInput } from "../types/interfaces";
import { getWorkProductDetailsByQuotationId, getWorkProductDetailsByWorkOrderId } from "./workProductDetailService";

export const getAllWorkOrders = async (): Promise<WorkOrder[]> => {
  const response = await api.get("/workOrders");
  return response.data;
};

export const getWorkOrderById = async (id: number): Promise<WorkOrder> => {
  const response = await api.get(`/workOrders/${id}`);
  return response.data;
};

// Nueva función para obtener orden de trabajo con todos los detalles
export const getCompleteWorkOrderById = async (id: number): Promise<WorkOrder> => {
  try {
    // Obtenemos la orden de trabajo básica - Aseguramos que se incluyan todas las relaciones necesarias
    const response = await api.get(`/workOrders/${id}`);
    const workOrder = response.data;
    
    console.log("API response for work order:", workOrder);
    console.log("Product details from API:", workOrder.productDetails);
    
    // Si el vehículo no tiene las relaciones completas, podríamos cargarlas por separado
    if (workOrder.vehicle && (!workOrder.vehicle.model?.brand || !workOrder.vehicle.owner)) {
      try {
        // Intentar obtener información completa del vehículo si es necesario
        const vehicleResponse = await api.get(`/vehicles/${workOrder.vehicle.vehicle_id}`);
        workOrder.vehicle = vehicleResponse.data;
        console.log("Loaded complete vehicle data:", workOrder.vehicle);
      } catch (vehicleError) {
        console.error("Error loading complete vehicle:", vehicleError);
      }
    }
    
    // Los productos deberían venir directamente del API en workOrder.productDetails
    // Solo cargamos por separado si realmente no hay datos
    if (!workOrder.productDetails || workOrder.productDetails.length === 0) {
      console.log("No product details found, attempting to load separately...");
      try {
        // Primero intentamos obtener por work_order_id
        const productDetails = await getWorkProductDetailsByWorkOrderId(id);
        if (productDetails && productDetails.length > 0) {
          workOrder.productDetails = productDetails;
          console.log("Loaded product details separately:", productDetails);
        } 
        // Si no hay detalles directos y hay una cotización, intentamos por ahí
        else if (workOrder.quotation?.quotation_id) {
          const quotationDetails = await getWorkProductDetailsByQuotationId(workOrder.quotation.quotation_id);
          if (quotationDetails && quotationDetails.length > 0) {
            workOrder.productDetails = quotationDetails;
            console.log("Loaded quotation details:", quotationDetails);
          }
        }
      } catch (error) {
        console.error("Error loading product details:", error);
      }
    } else {
      console.log("Product details loaded from main API call:", workOrder.productDetails);
    }
    
    return workOrder;
  } catch (error) {
    throw error;
  }
};

export const fetchWorkOrders = async (): Promise<WorkOrder[]> => {
  const { data } = await api.get<WorkOrder[]>("/workOrders");
  return data;
};

export const createWorkOrder = async (workOrderData: Partial<WorkOrderInput>): Promise<any> => {
  // Modificamos el tipo de retorno a 'any' para manejar la respuesta exacta del servidor
  const { data } = await api.post("/workOrders", workOrderData);
  return data; // Ahora devuelve el objeto completo { message, workOrder }
};

export const updateWorkOrder = async (workOrderId: number, workOrderData: Partial<WorkOrderInput>): Promise<WorkOrder> => {
  const { data } = await api.put<WorkOrder>(`/workOrders/${workOrderId}`, workOrderData);
  return data;
};

export const deleteWorkOrder = async (workOrderId: number) => {
  await api.delete(`/workOrders/${workOrderId}`);
};
