import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { Product, ProductType, Supplier, StockProduct } from "../../entities";
import { ProductSchema } from "../../schema/productValidator";

const productRepository = AppDataSource.getRepository(Product);
const productTypeRepository = AppDataSource.getRepository(ProductType);
const supplierRepository = AppDataSource.getRepository(Supplier);
const stockProductRepository = AppDataSource.getRepository(StockProduct);

export const getAllProducts = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const products = await productRepository.find({ relations: ["type", "type.category"] });
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

        // Verificar proveedor
        const supplierEntity = await supplierRepository.findOneBy({ supplier_id });
        if (!supplierEntity) {
            res.status(404).json({ message: "Proveedor no encontrado" });
            return;
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
            product_quantity: product_quantity ?? 0,
            supplier: supplierEntity,
            type: productTypeEntity
        });

        product = await productRepository.save(product); // Guardar producto y obtener su ID

        // **Paso 2: Insertar el stock con el `product_id` generado**
        const newStock = stockProductRepository.create({
            product: product, // Aquí se enlaza con el producto creado
            quantity: product_quantity
        });
        await stockProductRepository.save(newStock);

        res.status(201).json({ message: "Producto creado exitosamente", product });
    } catch (error: any) {
        console.error("Error al crear producto:", error);
        res.status(500).json({ message: "Error interno al crear producto", error: error.message || error });
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
        const result = await productRepository.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: "Producto no encontrado" });
            return;
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Error interno al eliminar el producto", error });
    }
};

