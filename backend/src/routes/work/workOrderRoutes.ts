import { Router } from "express";
import {

getAllWorkOrders,
getWorkOrderById,
createWorkOrder,
updateWorkOrder,
deleteWorkOrder,
} from "../../controllers/work/workOrderController";

const workOrderRoutes = Router();

workOrderRoutes.get("/", getAllWorkOrders);          // Obtener todas las órdenes de trabajo
workOrderRoutes.get("/:id", getWorkOrderById);         // Obtener una orden de trabajo por ID
workOrderRoutes.post("/", createWorkOrder);            // Crear una nueva orden de trabajo
workOrderRoutes.put("/:id", updateWorkOrder);          // Actualizar una orden de trabajo existente
workOrderRoutes.delete("/:id", deleteWorkOrder);       // Eliminar una orden de trabajo

export default workOrderRoutes;