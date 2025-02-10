import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/ormconfig";
import { StockProduct } from "../entities/stock_products";
import { StockProductSchema } from "../schema/stock_productsValidator";
import { DeepPartial } from "typeorm";

const stockProductRepository = AppDataSource.getRepository(StockProduct);

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
        const newStockProduct = stockProductRepository.create(validationResult.data as DeepPartial<StockProduct>);
        await stockProductRepository.save(newStockProduct);
        res.status(201).json({ message: "Producto en stock creado exitosamente", stockProduct: newStockProduct });
    } catch (error) {
        res.status(500).json({ message: "Error al crear el producto en stock", error });
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
        const validationResult = StockProductSchema.partial().safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: "Error de validación",
                errors: validationResult.error.errors
            });
            return;
        }
        stockProductRepository.merge(stockProduct, validationResult.data as DeepPartial<StockProduct>);
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