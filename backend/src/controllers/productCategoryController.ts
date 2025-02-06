import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/ormconfig";
import { ProductCategory } from "../entities/productCategoryEntity";
import { ProductCategorySchema } from "../schema/productCategoryValidator";

const productCategoryRepository = AppDataSource.getRepository(ProductCategory);

export const getAllProductCategories = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const categories = await productCategoryRepository.find();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener las categorías de producto", error });
    }
};

export const getProductCategoryById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const category = await productCategoryRepository.findOneBy({ product_category_id: id });
        if (!category) {
            res.status(404).json({ message: "Categoría de producto no encontrada" });
            return;
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener la categoría de producto", error });
    }
};

export const createProductCategory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = ProductCategorySchema.safeParse(req.body);
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

        const { category_name } = validationResult.data;
        const existingCategory = await productCategoryRepository.findOneBy({ category_name });
        if (existingCategory) {
            res.status(409).json({ message: `La categoría '${category_name}' ya existe.` });
            return;
        }

        const newCategory = productCategoryRepository.create(validationResult.data);
        await productCategoryRepository.save(newCategory);
        res.status(201).json({ message: "Categoría creada exitosamente", category: newCategory });
    } catch (error) {
        res.status(500).json({
            message: "Error al crear la categoría de producto",
            error: error instanceof Error ? error.message : error
        });
    }
};

export const updateProductCategory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const category = await productCategoryRepository.findOneBy({ product_category_id: id });
        if (!category) {
            res.status(404).json({ message: "Categoría de producto no encontrada" });
            return;
        }

        const validationResult = ProductCategorySchema.safeParse(req.body);
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

        productCategoryRepository.merge(category, validationResult.data);
        await productCategoryRepository.save(category);
        res.json({ message: "Categoría actualizada exitosamente", category });
    } catch (error) {
        res.status(500).json({
            message: "Error al actualizar la categoría de producto",
            error: error instanceof Error ? error.message : error
        });
    }
};

export const deleteProductCategory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const result = await productCategoryRepository.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: "Categoría de producto no encontrada" });
            return;
        }
        res.json({ message: "Categoría eliminada exitosamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar la categoría de producto", error });
    }
};