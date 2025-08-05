import { Router } from "express";
import {
  getAllWorkPayments,
  getWorkPaymentById,
  createWorkPayment,
  updateWorkPayment,
  deleteWorkPayment
} from "../../controllers/work/workPaymentController";

const router = Router();

// Obtener todos los pagos
router.get("/", getAllWorkPayments);

// Obtener un pago por ID
router.get("/:id", getWorkPaymentById);

// Crear un nuevo pago
router.post("/", createWorkPayment);

// Actualizar un pago existente
router.put("/:id", updateWorkPayment);

// Eliminar un pago
router.delete("/:id", deleteWorkPayment);

export default router;