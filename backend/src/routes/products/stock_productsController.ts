import { Router } from 'express';
import {

getAllStockProducts,
getStockProductById,
createStockProduct,
updateStockProduct,
deleteStockProduct,
} from '../../controllers/products/stock_productsController';

const router = Router();

// List all stock products
router.get('/', getAllStockProducts);

// Get a single stock product by ID
router.get('/:id', getStockProductById);

// Create a new stock product
router.post('/', createStockProduct);

// Update an existing stock product by ID
router.put('/:id', updateStockProduct);

// Delete a stock product by ID
router.delete('/:id', deleteStockProduct);

export default router;