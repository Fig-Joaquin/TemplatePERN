// src/controllers/productHistoryController.ts
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { Product, ProductHistory } from "../../entities";
import { productHistorySchema, updateProductHistorySchema } from "../../schema/products/productHistoryValidator";

const productHistoryRepository = AppDataSource.getRepository(ProductHistory);
const productRepository = AppDataSource.getRepository(Product);

/**
 * Obtiene todo el historial de productos, incluyendo la relación con el producto.
 */
export const getAllProductHistories = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const histories = await productHistoryRepository.find({ relations: ["product"] });
    res.json(histories);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el historial de productos", error });
  }
};

/**
 * Obtiene un historial de producto por su ID.
 */
export const getProductHistoryById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const history = await productHistoryRepository.findOne({
      where: { product_history_id: parseInt(id) },
      relations: ["product"]
    });
    if (!history) {
      res.status(404).json({ message: "Historial de producto no encontrado" });
      return;
    }
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el historial de producto", error });
  }
};

/**
 * Crea un nuevo registro en el historial de producto.
 */
export const createProductHistory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    // Validar los datos de entrada con Zod
    const validationResult = productHistorySchema.safeParse(req.body);
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
    
    const { product_id, description, last_purchase_price, sale_price } = validationResult.data;

    // Verificar que el producto exista
    const product = await productRepository.findOneBy({ product_id });
    if (!product) {
      res.status(404).json({ message: `Producto con ID ${product_id} no encontrado` });
      return;
    }

    // Crear el registro de historial asignando la entidad de producto
    const newHistory = productHistoryRepository.create({
      product,
      description,
      last_purchase_price,
      sale_price
    });

    await productHistoryRepository.save(newHistory);
    res.status(201).json({ message: "Historial de producto creado exitosamente", productHistory: newHistory });
  } catch (error: any) {
    res.status(500).json({
      message: "Error al crear historial de producto",
      error: error instanceof Error ? error.message : error
    });
  }
};

/**
 * Actualiza un registro del historial de producto.
 */
export const updateProductHistory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const history = await productHistoryRepository.findOne({
      where: { product_history_id: parseInt(id) },
      relations: ["product"]
    });
    if (!history) {
      res.status(404).json({ message: "Historial de producto no encontrado" });
      return;
    }

    // Validar los datos de actualización
    const validationResult = updateProductHistorySchema.safeParse(req.body);
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

    const updateData = validationResult.data;

    // Si se proporciona product_id, se busca y asigna la nueva entidad de producto
    if (updateData.product_id) {
      const product = await productRepository.findOneBy({ product_id: updateData.product_id });
      if (!product) {
        res.status(404).json({ message: `Producto con ID ${updateData.product_id} no encontrado` });
        return;
      }
      history.product = product;
      delete updateData.product_id;
    }

    // Mezclar los demás datos en la entidad existente
    productHistoryRepository.merge(history, updateData);
    await productHistoryRepository.save(history);
    res.json({ message: "Historial de producto actualizado exitosamente", productHistory: history });
  } catch (error: any) {
    res.status(500).json({
      message: "Error al actualizar historial de producto",
      error: error instanceof Error ? error.message : error
    });
  }
};

/**
 * Elimina un registro del historial de producto por su ID.
 */
export const deleteProductHistory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await productHistoryRepository.delete(parseInt(id));
    if (result.affected === 0) {
      res.status(404).json({ message: "Historial de producto no encontrado" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar historial de producto", error });
  }
};
