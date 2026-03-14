import { Router } from "express";
import {
    addServiceToWorkOrder,
    getServicesByWorkOrder,
    updateWorkOrderService,
    deleteWorkOrderService,
} from "../../controllers/work/workOrderServiceController";

// Nested routes: mounted at /workOrders → /workOrders/:id/services
export const workOrderServiceNestedRoutes = Router();
workOrderServiceNestedRoutes.post("/:id/services", addServiceToWorkOrder);
workOrderServiceNestedRoutes.get("/:id/services", getServicesByWorkOrder);

// Detail routes: mounted at /work-order-services → /work-order-services/:id
export const workOrderServiceDetailRoutes = Router();
workOrderServiceDetailRoutes.put("/:id", updateWorkOrderService);
workOrderServiceDetailRoutes.delete("/:id", deleteWorkOrderService);
