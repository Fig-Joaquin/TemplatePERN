// src/routes/productHistoryRoutes.ts
import { Router } from "express";
import { 
  getAllProductHistories, 
  getProductHistoryById, 
  createProductHistory, 
  updateProductHistory, 
  deleteProductHistory 
} from "../controllers/products/productHistoryController";

const productHistoryRoutes = Router();

// Las rutas serán relativas a la ruta que definas en tu index, por ejemplo, "/product-history"
productHistoryRoutes.get("/", getAllProductHistories);           // Obtiene todo el historial de productos
productHistoryRoutes.get("/:id", getProductHistoryById);           // Obtiene un historial de producto por ID
productHistoryRoutes.post("/", createProductHistory);              // Crea un nuevo registro de historial
productHistoryRoutes.put("/:id", updateProductHistory);            // Actualiza un registro de historial existente
productHistoryRoutes.delete("/:id", deleteProductHistory);         // Elimina un registro de historial

export default productHistoryRoutes;
