import { Router } from "express";
import { getAllDebtors, getDebtorById, createDebtor, updateDebtor, deleteDebtor, getDebtorsByWorkOrder, processPayment } from "../../controllers/work/debtorsController";
import { authenticateUser } from "../../middleware/authMiddleware";

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateUser);

// Rutas de deudores
router.get("/", getAllDebtors);
router.get("/work-order/:work_order_id", getDebtorsByWorkOrder);
router.get("/:id", getDebtorById);
router.post("/", createDebtor);
router.put("/:id", updateDebtor);
router.delete("/:id", deleteDebtor);
router.post("/:id/payment", processPayment);

export { router as debtorsRoutes };
