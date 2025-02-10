import { Router } from "express";
import {

getAllProducts,
getProductById,
createProduct,
updateProduct,
deleteProduct
} from "../../controllers/products/productController";

const productRoutes = Router();

// Obtener todos los productos
productRoutes.get("/", getAllProducts);

// Obtener un producto por ID
productRoutes.get("/:id", getProductById);

// Crear un nuevo producto
productRoutes.post("/", createProduct);

// Actualizar un producto existente
productRoutes.put("/:id", updateProduct);

// Eliminar un producto
productRoutes.delete("/:id", deleteProduct);

export default productRoutes;