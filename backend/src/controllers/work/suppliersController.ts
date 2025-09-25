import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { SupplierSchema } from "../../schema/work/suppliersValidator";
import { DeepPartial } from "typeorm";
import { Product, Supplier } from "../../entities"; // <-- nueva importación

const supplierRepository = AppDataSource.getRepository(Supplier);
const productRepository = AppDataSource.getRepository(Product); // <-- nuevo repositorio

export const getAllSuppliers = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const suppliers = await supplierRepository.find();
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener proveedores", error });
    }
};

export const getSupplierById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const supplier = await supplierRepository.findOneBy({ supplier_id: id });
        if (!supplier) {
            res.status(404).json({ message: "Proveedor no encontrado" });
            return;
        }

        res.json(supplier);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el proveedor", error });
    }
};

export const createSupplier = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = SupplierSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: "Error de validación",
                errors: validationResult.error.errors.map(err => ({
                    field: err.path.join("."),
                    message: err.message
                }))
            });
            return;
        }
        // Extraer product_id y demás datos
        const { product_id, ...supplierData } = validationResult.data as { product_id?: number; [key: string]: unknown };
        if (product_id) {
            const product = await productRepository.findOneBy({ product_id });
            if (!product) {
                res.status(404).json({ message: "Producto no encontrado" });
                return;
            }
            supplierData.products = [product];
        }
        const newSupplier = supplierRepository.create(supplierData as DeepPartial<Supplier>);
        await supplierRepository.save(newSupplier);
        res.status(201).json({ message: "Proveedor creado exitosamente", supplier: newSupplier });
    } catch (error) {
        res.status(500).json({ message: "Error al crear el proveedor", error });
    }
};

export const updateSupplier = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const supplier = await supplierRepository.findOneBy({ supplier_id: id });
        if (!supplier) {
            res.status(404).json({ message: "Proveedor no encontrado" });
            return;
        }

        const validationResult = SupplierSchema.partial().safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: "Error de validación",
                errors: validationResult.error.errors.map(err => ({
                    field: err.path.join("."),
                    message: err.message
                }))
            });
            return;
        }

        const updateData = validationResult.data as { product_id?: number } & { products?: Product[] };
        if (updateData.product_id) {
            const product = await productRepository.findOneBy({ product_id: updateData.product_id });
            if (!product) {
                res.status(404).json({ message: "Producto no encontrado" });
                return;
            }
            updateData.products = [product];
            delete updateData.product_id;
        }

        supplierRepository.merge(supplier, updateData as DeepPartial<Supplier>);
        await supplierRepository.save(supplier);
        res.json({ message: "Proveedor actualizado exitosamente", supplier });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el proveedor", error });
    }
};

export const deleteSupplier = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        // Verificar si el proveedor existe y tiene productos asociados
        const supplier = await supplierRepository.findOne({
            where: { supplier_id: id },
            relations: ["products"]
        });

        if (!supplier) {
            res.status(404).json({ message: "Proveedor no encontrado" });
            return;
        }

        // Verificar si tiene productos asociados
        if (supplier.products && supplier.products.length > 0) {
            res.status(409).json({ 
                message: `No se puede eliminar el proveedor porque tiene ${supplier.products.length} producto(s) asociado(s). Debe reasignar o eliminar estos productos primero.`,
                details: {
                    associatedProducts: supplier.products.length,
                    productNames: supplier.products.map(p => p.product_name).slice(0, 5) // Mostrar máximo 5 nombres
                }
            });
            return;
        }

        const result = await supplierRepository.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: "Proveedor no encontrado" });
            return;
        }

        res.json({ message: "Proveedor eliminado exitosamente" });
    } catch (error: unknown) {
        console.error("Error al eliminar proveedor:", error);
        
        // Manejo específico de errores de restricción de clave foránea
        if (error && typeof error === 'object' && 'code' in error && 
            (error.code === "23503" || error.code === "23505")) {
            res.status(409).json({ 
                message: "No se puede eliminar el proveedor porque tiene productos asociados. Debe reasignar o eliminar estos productos primero." 
            });
            return;
        }
        
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ message: "Error al eliminar el proveedor", error: errorMessage });
    }
};