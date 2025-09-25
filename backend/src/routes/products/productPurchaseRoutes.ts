import { Router } from "express";
import {
  getAllProductPurchases,
  getPurchasesByHistoryId,
  createProductPurchase,
  updatePurchaseStatus,
  deleteProductPurchase,
  getPurchaseHistory,
  verifyProductStock
} from "../../controllers/products/productPurchaseController";

const router = Router();

// Rutas para el historial de compras
router.get("/history", getPurchaseHistory);
router.get("/history/:historyId", getPurchasesByHistoryId);

// Ruta para verificar stock (debugging)
router.get("/verify-stock/:product_id", verifyProductStock);

// Rutas para compras de productos
router.get("/", getAllProductPurchases);
router.post("/", createProductPurchase);
router.patch("/:id/status", updatePurchaseStatus);
router.delete("/:id", deleteProductPurchase);

export default router;
