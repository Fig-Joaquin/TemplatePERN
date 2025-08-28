/* eslint-disable no-console */
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { Product, ProductType, Supplier, StockProduct, WorkProductDetail, ProductPurchase } from "../../entities";
import { ProductSchema } from "../../schema/products/productValidator";

const productRepository = AppDataSource.getRepository(Product);
const productTypeRepository = AppDataSource.getRepository(ProductType);
const supplierRepository = AppDataSource.getRepository(Supplier);
const stockProductRepository = AppDataSource.getRepository(StockProduct);
const workProductDetailRepository = AppDataSource.getRepository(WorkProductDetail);
const productPurchaseRepository = AppDataSource.getRepository(ProductPurchase);

export const getAllProducts = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const products = await productRepository.find({ relations: ["type", "type.category", "stock"] });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los productos", error });
    }
};

export const getProductById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const product = await productRepository.findOne({
            where: { product_id: id },
            relations: ["type"],
        });
        if (!product) {
            res.status(404).json({ message: "Producto no encontrado" });
            return;
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el producto", error });
    }
};

export const createProduct = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        console.log("Request Body recibido:", req.body);

        // Validar la entrada con Zod
        const validationResult = ProductSchema.safeParse(req.body);
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

        // Extraer los datos validados
        const productData = validationResult.data;
        const { supplier_id, product_type_id, product_quantity, ...restData } = productData;
        

        let supplierEntity = null;
        if (supplier_id) {
            supplierEntity = await supplierRepository.findOneBy({ supplier_id });
            if (!supplierEntity) {
            res.status(404).json({ message: "Proveedor no encontrado" });
            return;
            }
        }

        // Verificar tipo de producto
        const productTypeEntity = await productTypeRepository.findOne({
            where: { product_type_id },
            relations: ["category"]
        });
        if (!productTypeEntity) {
            res.status(404).json({ message: "Tipo de producto no encontrado" });
            return;
        }

        // **Paso 1: Insertar el producto SIN el stock aún**
        let product = productRepository.create({
            ...restData,
            supplier: supplierEntity || undefined,
            type: productTypeEntity,
            product_quantity
        });

        product = await productRepository.save(product); // Guardar producto y obtener su ID

        // **Paso 2: Insertar el stock con el `product_id` generado**
        const newStock = stockProductRepository.create({
            product: product, // Aquí se enlaza con el producto creado
            quantity: product_quantity
        });
        await stockProductRepository.save(newStock);

        res.status(201).json({ message: "Producto creado exitosamente", product });
    } catch (error: unknown) {
        console.error("Error al crear producto:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: "Error interno al crear producto", error: errorMessage });
    }
};




export const updateProduct = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const product = await productRepository.findOneBy({ product_id: id });
        if (!product) {
            res.status(404).json({ message: "Producto no encontrado" });
            return;
        }

        const validationResult = ProductSchema.partial().safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: "Error de validación",
                errors: validationResult.error.errors.map(err => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
            return;
        }

        const updateData = validationResult.data;
        productRepository.merge(product, updateData);
        await productRepository.save(product);
        res.json({ message: "Producto actualizado exitosamente", product });
    } catch (error) {
        res.status(500).json({ message: "Error interno al actualizar el producto", error });
    }
};

export const deleteProduct = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        
        // Buscar el producto con todas sus relaciones
        const product = await productRepository.findOne({
            where: { product_id: id },
            relations: ["stock", "history"]
        });
        
        if (!product) {
            res.status(404).json({ message: "Producto no encontrado" });
            return;
        }

        // Verificar si el producto está siendo usado en detalles de trabajo
        const workDetails = await workProductDetailRepository.find({
            where: { product: { product_id: id } },
            relations: ["quotation", "work_order"]
        });
        
        if (workDetails.length > 0) {
            // Construir mensaje específico sobre dónde se está usando
            const quotationCount = workDetails.filter(detail => detail.quotation).length;
            const workOrderCount = workDetails.filter(detail => detail.work_order).length;
            
            let usageMessage = "No se puede eliminar el producto porque está siendo usado en: ";
            const usages = [];
            
            if (quotationCount > 0) {
                usages.push(`${quotationCount} cotización(es)`);
            }
            if (workOrderCount > 0) {
                usages.push(`${workOrderCount} orden(es) de trabajo`);
            }
            
            usageMessage += usages.join(" y ");
            
            res.status(409).json({ 
                message: usageMessage,
                details: {
                    quotations: quotationCount,
                    workOrders: workOrderCount,
                    total: workDetails.length
                }
            });
            return;
        }

        // Verificar si el producto está siendo usado en compras
        const productPurchases = await productPurchaseRepository.find({
            where: { product: { product_id: id } }
        });
        
        if (productPurchases.length > 0) {
            res.status(409).json({ 
                message: "No se puede eliminar el producto porque tiene historial de compras asociado" 
            });
            return;
        }

        // Eliminar el historial del producto manualmente si existe
        if (product.history && product.history.length > 0) {
            for (const historyItem of product.history) {
                await productRepository.manager.remove(historyItem);
            }
        }

        // Eliminar el stock del producto manualmente si existe
        if (product.stock) {
            await stockProductRepository.remove(product.stock);
        }

        // Ahora eliminar el producto
        await productRepository.remove(product);
        
        res.status(204).send();
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        res.status(500).json({ message: "Error interno al eliminar el producto", error });
    }
};

