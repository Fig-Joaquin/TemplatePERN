import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { StockProduct, Product } from "../../entities";
import { StockProductSchema } from "../../schema/products/stock_productsValidator";
import { DeepPartial } from "typeorm";

const stockProductRepository = AppDataSource.getRepository(StockProduct);
const productRepository = AppDataSource.getRepository(Product); // <-- nuevo repositorio

export const getAllStockProducts = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const stockProducts = await stockProductRepository.find({ relations: ["product"] });
        res.json(stockProducts);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los productos en stock", error });
    }
};

export const getStockProductById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }
        const stockProduct = await stockProductRepository.findOne({
            where: { stock_product_id: id },
            relations: ["product"]
        });
        if (!stockProduct) {
            res.status(404).json({ message: "Producto en stock no encontrado" });
            return;
        }
        res.json(stockProduct);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el producto en stock", error });
    }
};

export const createStockProduct = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = StockProductSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: "Error de validación",
                errors: validationResult.error.errors
            });
            return;
        }

        const { product_id, quantity } = validationResult.data;

        // Verificar si el producto ya tiene un stock
        const existingStock = await stockProductRepository.findOneBy({ product: { product_id } });
        if (existingStock) {
            res.status(400).json({ message: "El producto ya tiene stock registrado." });
            return;
        }

        const product = await productRepository.findOneBy({ product_id });
        if (!product) {
            res.status(404).json({ message: "Producto no encontrado" });
            return;
        }

        const newStockProduct = stockProductRepository.create({ product, quantity });
        await stockProductRepository.save(newStockProduct);
        res.status(201).json({ message: "Stock creado exitosamente", stockProduct: newStockProduct });
    } catch (error) {
        res.status(500).json({ message: "Error al crear el stock", error });
    }
};

export const updateStockProduct = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }
        const stockProduct = await stockProductRepository.findOneBy({ stock_product_id: id });
        if (!stockProduct) {
            res.status(404).json({ message: "Producto en stock no encontrado" });
            return;
        }
        const updateData = (await StockProductSchema.partial().safeParse(req.body)).data as any;
        // Verificar si se provee product_id directamente en la actualización
        if (updateData.product_id) {
            const product = await productRepository.findOneBy({ product_id: updateData.product_id });
            if (!product) {
                res.status(404).json({ message: "Producto no encontrado" });
                return;
            }
            updateData.product = product;
            delete updateData.product_id;
        }
        stockProductRepository.merge(stockProduct, updateData as DeepPartial<StockProduct>);
        await stockProductRepository.save(stockProduct);
        res.json({ message: "Producto en stock actualizado exitosamente", stockProduct });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el producto en stock", error });
    }
};

export const deleteStockProduct = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }
        const result = await stockProductRepository.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: "Producto en stock no encontrado" });
            return;
        }
        res.json({ message: "Producto en stock eliminado exitosamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el producto en stock", error });
    }
};