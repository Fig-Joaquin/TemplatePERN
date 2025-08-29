import { Request, Response } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { ProductPurchase } from "../../entities/products/productPurchaseEntity";
import { Product } from "../../entities/products/productEntity";
import { PurchaseHistory } from "../../entities/products/purchaseHistoryEntity";
import { StockProduct } from "../../entities/products/stockProductEntity";
import { ProductPurchaseSchema } from "../../schema/products/productPurchaseValidator";
import { z } from "zod";

const productPurchaseRepository = AppDataSource.getRepository(ProductPurchase);
const purchaseHistoryRepository = AppDataSource.getRepository(PurchaseHistory);
const stockProductRepository = AppDataSource.getRepository(StockProduct);

// Schema para crear una compra completa con historial
const CreatePurchaseSchema = z.object({
  purchase_date: z.string().transform((val) => new Date(val)),
  arrival_date: z.string().transform((val) => new Date(val)),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres").max(500),
  products: z.array(ProductPurchaseSchema)
});

// Obtener todas las compras con detalles
export const getAllProductPurchases = async (_req: Request, res: Response): Promise<void> => {
  try {
    const purchases = await productPurchaseRepository.find({
      relations: {
        product: {
          type: true,
          supplier: true
        },
        purchase_history: true
      },
      order: {
        purchase_history: {
          purchase_date: "DESC"
        }
      }
    });

    res.status(200).json(purchases);
  } catch (error) {
    console.error("Error al obtener compras de productos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener compras por ID del historial de compra
export const getPurchasesByHistoryId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { historyId } = req.params;
    
    const purchases = await productPurchaseRepository.find({
      where: { purchase_history: { purchase_history_id: parseInt(historyId) } },
      relations: {
        product: {
          type: true,
          supplier: true
        },
        purchase_history: true
      }
    });

    if (purchases.length === 0) {
      res.status(404).json({ message: "No se encontraron compras para este historial" });
      return;
    }

    res.status(200).json(purchases);
  } catch (error) {
    console.error("Error al obtener compras por historial:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Crear una nueva compra completa
export const createProductPurchase = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Datos recibidos para crear compra:", req.body);
    
    // Validar datos
    const validatedData = CreatePurchaseSchema.parse(req.body);
    
    // Iniciar transacción
    await AppDataSource.transaction(async (transactionalEntityManager) => {
      // 1. Crear el historial de compra
      const purchaseHistory = purchaseHistoryRepository.create({
        purchase_date: validatedData.purchase_date,
        arrival_date: validatedData.arrival_date,
        description: validatedData.description
      });
      
      const savedHistory = await transactionalEntityManager.save(purchaseHistory);
      console.log("Historial de compra creado:", savedHistory.purchase_history_id);

      // 2. Procesar cada producto
      for (const productData of validatedData.products) {
        // Validar que el producto existe
        const product = await transactionalEntityManager.findOne(Product, {
          where: { product_id: productData.product_id }
        });
        
        if (!product) {
          throw new Error(`Producto con ID ${productData.product_id} no encontrado`);
        }

        // 3. Crear la compra del producto
        const productPurchase = productPurchaseRepository.create({
          product: product,
          purchase_history: savedHistory,
          purchase_status: productData.purchase_status,
          purchase_price: productData.purchase_price,
          quantity: productData.quantity,
          total_price: productData.total_price
        });

        await transactionalEntityManager.save(productPurchase);
        console.log(`Compra creada para producto ${product.product_name}:`, productPurchase.product_purchase_id);

        // 4. Actualizar precio de última compra si es mayor al actual
        if (productData.purchase_price > product.last_purchase_price) {
          product.last_purchase_price = productData.purchase_price;
          await transactionalEntityManager.save(product);
          console.log(`Precio de última compra actualizado para ${product.product_name}: $${productData.purchase_price}`);
        }

        // 5. Actualizar stock si la compra está procesada
        if (productData.purchase_status === "processed") {
          let stockProduct = await transactionalEntityManager.findOne(StockProduct, {
            where: { product: { product_id: productData.product_id } },
            relations: ["product"]
          });

          const quantityToAdd = Number(productData.quantity);
          console.log(`Cantidad a agregar: ${quantityToAdd} para producto ${product.product_name}`);

          if (stockProduct) {
            // Actualizar stock existente
            const currentStock = Number(stockProduct.quantity);
            const newStock = currentStock + quantityToAdd;
            
            console.log(`Stock anterior: ${currentStock}, cantidad a agregar: ${quantityToAdd}, nuevo stock: ${newStock}`);
            
            stockProduct.quantity = newStock;
            stockProduct.updated_at = new Date();
            await transactionalEntityManager.save(stockProduct);
            console.log(`Stock actualizado para producto ${product.product_name}: ${stockProduct.quantity}`);
          } else {
            // Crear nuevo registro de stock
            stockProduct = stockProductRepository.create({
              product: product,
              quantity: quantityToAdd,
              updated_at: new Date()
            });
            await transactionalEntityManager.save(stockProduct);
            console.log(`Nuevo stock creado para producto ${product.product_name}: ${quantityToAdd}`);
          }
        }
      }
    });

    res.status(201).json({ message: "Compra creada exitosamente" });
  } catch (error) {
    console.error("Error al crear compra de productos:", error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        message: "Datos inválidos", 
        errors: error.errors 
      });
      return;
    }
    
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
      return;
    }
    
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Actualizar estado de una compra
export const updatePurchaseStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { purchase_status } = req.body;

    if (!["processed", "returned"].includes(purchase_status)) {
      res.status(400).json({ message: "Estado de compra inválido" });
      return;
    }

    const purchase = await productPurchaseRepository.findOne({
      where: { product_purchase_id: parseInt(id) },
      relations: ["product"]
    });

    if (!purchase) {
      res.status(404).json({ message: "Compra no encontrada" });
      return;
    }

    await AppDataSource.transaction(async (transactionalEntityManager) => {
      const oldStatus = purchase.purchase_status;
      purchase.purchase_status = purchase_status;
      
      await transactionalEntityManager.save(purchase);

      // Ajustar stock según el cambio de estado
      const stockProduct = await transactionalEntityManager.findOne(StockProduct, {
        where: { product: { product_id: purchase.product.product_id } },
        relations: ["product"]
      });

      if (stockProduct) {
        const currentStock = Number(stockProduct.quantity);
        const purchaseQuantity = Number(purchase.quantity);
        
        if (oldStatus === "returned" && purchase_status === "processed") {
          // De devuelto a procesado: agregar al stock
          const newStock = currentStock + purchaseQuantity;
          console.log(`Cambio de estado: agregando ${purchaseQuantity} al stock. Stock anterior: ${currentStock}, nuevo: ${newStock}`);
          stockProduct.quantity = newStock;
        } else if (oldStatus === "processed" && purchase_status === "returned") {
          // De procesado a devuelto: quitar del stock
          const newStock = Math.max(0, currentStock - purchaseQuantity);
          console.log(`Cambio de estado: quitando ${purchaseQuantity} del stock. Stock anterior: ${currentStock}, nuevo: ${newStock}`);
          stockProduct.quantity = newStock;
        }
        
        stockProduct.updated_at = new Date();
        await transactionalEntityManager.save(stockProduct);
      }
    });

    res.status(200).json({ message: "Estado de compra actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar estado de compra:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Eliminar una compra
export const deleteProductPurchase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const purchase = await productPurchaseRepository.findOne({
      where: { product_purchase_id: parseInt(id) },
      relations: ["product"]
    });

    if (!purchase) {
      res.status(404).json({ message: "Compra no encontrada" });
      return;
    }

    await AppDataSource.transaction(async (transactionalEntityManager) => {
      // Si la compra estaba procesada, restar del stock
      if (purchase.purchase_status === "processed") {
        const stockProduct = await transactionalEntityManager.findOne(StockProduct, {
          where: { product: { product_id: purchase.product.product_id } },
          relations: ["product"]
        });

        if (stockProduct) {
          const currentStock = Number(stockProduct.quantity);
          const purchaseQuantity = Number(purchase.quantity);
          const newStock = Math.max(0, currentStock - purchaseQuantity);
          
          console.log(`Eliminando compra: quitando ${purchaseQuantity} del stock. Stock anterior: ${currentStock}, nuevo: ${newStock}`);
          
          stockProduct.quantity = newStock;
          stockProduct.updated_at = new Date();
          await transactionalEntityManager.save(stockProduct);
        }
      }

      await transactionalEntityManager.remove(purchase);
    });

    res.status(200).json({ message: "Compra eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar compra:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener historial de compras
export const getPurchaseHistory = async (_req: Request, res: Response): Promise<void> => {
  try {
    const history = await purchaseHistoryRepository.find({
      relations: {
        purchases: {
          product: {
            type: true,
            supplier: true
          }
        }
      },
      order: {
        purchase_date: "DESC"
      }
    });

    res.status(200).json(history);
  } catch (error) {
    console.error("Error al obtener historial de compras:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Función para verificar y corregir stock (para debugging)
export const verifyProductStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { product_id } = req.params;

    // Obtener todas las compras procesadas para el producto
    const processedPurchases = await productPurchaseRepository.find({
      where: { 
        product: { product_id: parseInt(product_id) },
        purchase_status: "processed"
      },
      relations: ["product"]
    });

    // Calcular stock teórico
    const theoreticalStock = processedPurchases.reduce((total, purchase) => {
      return total + Number(purchase.quantity);
    }, 0);

    // Obtener stock actual
    const stockProduct = await stockProductRepository.findOne({
      where: { product: { product_id: parseInt(product_id) } },
      relations: ["product"]
    });

    const actualStock = stockProduct ? Number(stockProduct.quantity) : 0;

    res.status(200).json({
      product_id: parseInt(product_id),
      theoretical_stock: theoreticalStock,
      actual_stock: actualStock,
      difference: actualStock - theoreticalStock,
      processed_purchases: processedPurchases.map(p => ({
        purchase_id: p.product_purchase_id,
        quantity: Number(p.quantity),
        purchase_date: p.purchase_history
      }))
    });
  } catch (error) {
    console.error("Error al verificar stock:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
