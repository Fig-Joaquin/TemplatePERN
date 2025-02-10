import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { ProductType, ProductCategory } from "../../entities";
import { ProductTypeSchema, ProductTypeInput } from "../../schema/productTypeValidator";

const productTypeRepository = AppDataSource.getRepository(ProductType);
const ProductCategoryRepository = AppDataSource.getRepository(ProductCategory); // <-- nuevo repositorio

export const getAllProductTypes = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const types = await productTypeRepository.find({ relations: ["category"] });
        res.json(types);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los tipos de producto", error });
    }
};

export const getProductTypeById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const type = await productTypeRepository.findOne({
            where: { product_type_id: id },
            relations: ["category"]
        });
        if (!type) {
            res.status(404).json({ message: "Tipo de producto no encontrado" });
            return;
        }
        res.json(type);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el tipo de producto", error });
    }
};

export const createProductType = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = ProductTypeSchema.safeParse(req.body);
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
        const data: ProductTypeInput = validationResult.data;
        const { product_category_id, ...typeData } = data;
        
        // Verificar que la categoría exista usando el id proporcionado directamente
        const category = await ProductCategoryRepository.findOneBy({ product_category_id });
        if (!category) {
            res.status(404).json({ message: "Categoría no encontrada" });
            return;
        }
        
        const newType = productTypeRepository.create({
            ...typeData,
            category  // Se utiliza el objeto de categoría verificado
        });
        await productTypeRepository.save(newType);
        res.status(201).json({ message: "Tipo de producto creado exitosamente", productType: newType });
    } catch (error) {
        res.status(500).json({ message: "Error al crear el tipo de producto", error });
    }
};

export const updateProductType = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const type = await productTypeRepository.findOneBy({ product_type_id: id });
        if (!type) {
            res.status(404).json({ message: "Tipo de producto no encontrado" });
            return;
        }
        const validationResult = ProductTypeSchema.safeParse(req.body);
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
        const data: ProductTypeInput = validationResult.data;
        const { product_category_id, ...typeData } = data;

        productTypeRepository.merge(type, typeData);
        if (product_category_id) {
            // Verificar que la categoría exista usando el id proporcionado directamente
            const category = await ProductCategoryRepository.findOneBy({ product_category_id });
            if (!category) {
                res.status(404).json({ message: "Categoría no encontrada" });
                return;
            }
            type.category = category;
        }
        await productTypeRepository.save(type);
        res.json({ message: "Tipo de producto actualizado exitosamente", productType: type });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el tipo de producto", error });
    }
};

export const deleteProductType = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const result = await productTypeRepository.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: "Tipo de producto no encontrado" });
            return;
        }
        res.json({ message: "Tipo de producto eliminado exitosamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el tipo de producto", error });
    }
};