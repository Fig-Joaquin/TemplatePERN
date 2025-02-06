import { Request, Response, NextFunction } from "express";
import { QueryFailedError } from "typeorm";
import { AppDataSource } from "../config/ormconfig";
import { Product } from "../entities/productEntity";
import { ProductSchema } from "../schema/productValidator";

const productRepository = AppDataSource.getRepository(Product);

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
        const product = productRepository.create(productData);
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