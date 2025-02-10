// src/routes/suppliersRoutes.ts
import { Router } from "express";
import { 
  getAllSuppliers, 
  getSupplierById, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier 
} from "../controllers/suppliersController";

const suppliersRoutes = Router();

// Estas rutas serán relativas a la ruta base que definas en tu index, por ejemplo: /suppliers
suppliersRoutes.get("/", getAllSuppliers);          // Obtiene todos los proveedores
suppliersRoutes.get("/:id", getSupplierById);         // Obtiene un proveedor por ID
suppliersRoutes.post("/", createSupplier);            // Crea un nuevo proveedor
suppliersRoutes.put("/:id", updateSupplier);          // Actualiza un proveedor existente
suppliersRoutes.delete("/:id", deleteSupplier);       // Elimina un proveedor

export default suppliersRoutes;
