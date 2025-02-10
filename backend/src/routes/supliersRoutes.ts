import { Router } from 'express';
import {

getAllSuppliers,
getSupplierById,
createSupplier,
updateSupplier,
deleteSupplier,
} from '../controllers/suppliersController';

const router = Router();

// Obtener todos los proveedores
router.get('/', getAllSuppliers);

// Obtener un proveedor por id
router.get('/:id', getSupplierById);

// Crear un nuevo proveedor
router.post('/', createSupplier);

// Actualizar un proveedor por id
router.put('/:id', updateSupplier);

// Eliminar un proveedor por id
router.delete('/:id', deleteSupplier);

export default router;