import { createWorkOrderTechnician, deleteWorkOrderTechnician, getAllWorkOrderTechnicians, getWorkOrderTechnicianById, updateWorkOrderTechnician } from "../../controllers/workOrderTechnicianController";
import { Router } from "express";


const workOrderTechnicianRoutes = Router();

// Obtiene todas las asignaciones de técnicos a órdenes de trabajo
workOrderTechnicianRoutes.get("/", getAllWorkOrderTechnicians);

// Obtiene una asignación específica por su ID
workOrderTechnicianRoutes.get("/:id", getWorkOrderTechnicianById);

// Crea una nueva asignación de técnico a una orden
workOrderTechnicianRoutes.post("/", createWorkOrderTechnician);

// Actualiza una asignación existente
workOrderTechnicianRoutes.put("/:id", updateWorkOrderTechnician);

// Elimina una asignación
workOrderTechnicianRoutes.delete("/:id", deleteWorkOrderTechnician);

export default workOrderTechnicianRoutes;
