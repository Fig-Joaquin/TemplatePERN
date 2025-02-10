import { Request, Response, NextFunction } from "express";
import { QueryFailedError } from "typeorm";
import { AppDataSource } from "../config/ormconfig";
import { Product } from "../entities/productEntity";
import { ProductType } from "../entities/productTypeEntity";
import { Supplier } from "../entities/suppliersEntity";
import { ProductSchema } from "../schema/productValidator";

const productRepository = AppDataSource.getRepository(Product);
const productTypeRepository = AppDataSource.getRepository(ProductType);
const supplierRepository = AppDataSource.getRepository(Supplier);

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
        console.log("Request Body:", JSON.stringify(req.body, null, 2));
        const validationResult = ProductSchema.safeParse(req.body);

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

        const productData = validationResult.data;

        // Buscamos las entidades existentes según los IDs recibidos
        const supplierId = productData.supplier_id;
        const productTypeId = productData.product_type_id;

        const supplierEntity = await supplierRepository.findOne({ where: { supplier_id: supplierId } });
        if (!supplierEntity) {
            res.status(404).json({ message: "Proveedor no encontrado" });
            return;
        }
        const productTypeEntity = await productTypeRepository.findOne({ where: { product_type_id: productTypeId } });
        if (!productTypeEntity) {
            res.status(404).json({ message: "Tipo de producto no encontrado" });
            return;
        }

        // Asignamos las entidades encontradas al producto
        productData.supplier = supplierEntity as unknown as { name: string; address: string; city: string; description: string; phone: string; product_id: number; supplier_id?: number | undefined; products?: any[] | undefined; };
        productData.type = { ...productTypeEntity, product_category_id: productTypeEntity.category?.product_category_id };



        console.log("VALIDACION: " + JSON.stringify(productData, null, 2));
        const product = productRepository.create(productData);
        console.log("PRODUCTO FINAL :" + JSON.stringify(product, null, 2));
        await productRepository.save(product);
        res.status(201).json({ message: "Producto creado exitosamente", product });
    } catch (error) {
        if (error instanceof QueryFailedError) {
            res.status(409).json({ message: "Error al crear el producto", error: error.message });
            return;
        }
        res.status(500).json({ message: "Error interno al crear el producto", error });
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

