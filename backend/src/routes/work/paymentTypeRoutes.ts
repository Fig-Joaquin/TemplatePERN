import { Router } from "express";
import {
  getAllPaymentTypes,
  getPaymentTypeById,
  createPaymentType,
  updatePaymentType,
  deletePaymentType
} from "../../controllers/work/paymentTypeController";

const router = Router();

// Obtener todos los tipos de pago
router.get("/", getAllPaymentTypes);

// Obtener un tipo de pago por ID
router.get("/:id", getPaymentTypeById);

// Crear un nuevo tipo de pago
router.post("/", createPaymentType);

// Actualizar un tipo de pago existente
router.put("/:id", updatePaymentType);

// Eliminar un tipo de pago
router.delete("/:id", deletePaymentType);

export default router;