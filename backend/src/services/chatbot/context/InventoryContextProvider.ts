import { BaseContextProvider } from './BaseContextProvider';
import { AppDataSource } from '../../../config/ormconfig';
import { StockProduct } from '../../../entities';
import { LessThan } from 'typeorm';

export class InventoryContextProvider extends BaseContextProvider {
  shouldHandleQuery(query: string): boolean {
    const keywords = [
      'stock', 'inventario', 'producto', 'disponible', 'almacén', 'almacen',
      'productos', 'repuestos', 'insumos', 'piezas', 'partes', 'componentes',
      'hay en stock', 'hay disponible', 'existencias', 'cantidad', 
      'cuántos productos', 'cuantos productos', 'qué productos', 'que productos',
      'dime el stock', 'ver stock', 'consultar stock', 'mostrar inventario'
    ];
    return keywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  async getContext(query: string): Promise<string> {
    try {
      // Check for specific product query
      const productNameMatch = query.match(/producto\s+([\wáéíóúüñ\s]+)/i);
      const searchTerm = productNameMatch ? productNameMatch[1].trim().toLowerCase() : null;
      
      const stockRepository = AppDataSource.getRepository(StockProduct);
      
      // If looking for a specific product
      if (searchTerm) {
        const specificProducts = await stockRepository.createQueryBuilder('stock')
          .leftJoinAndSelect('stock.product', 'product')
          .where('LOWER(product.product_name) LIKE :name', { name: `%${searchTerm}%` })
          .getMany();
        
        if (specificProducts.length === 0) {
          return `DATOS: Se buscaron productos con el término "${searchTerm}" pero NO EXISTEN en la base de datos.`;
        }
        
        let productContext = `DATOS DE PRODUCTOS ENCONTRADOS CON "${searchTerm}":\n\n`;
        
        specificProducts.forEach(stock => {
          productContext += `
PRODUCTO: ${stock.product.product_name}
- Stock disponible: ${stock.quantity} unidades
- Precio: ${this.formatPrice(stock.product.sale_price)}
- Código: ${stock.product.product_id}
`;
        });
        
        return productContext;
      }
      
      // Get all inventory with pagination
      const stocks = await stockRepository.find({
        relations: ['product'],
        order: {
          quantity: 'DESC'  // Order by quantity for relevance
        },
        take: 15  // Show more products
      });
      
      if (stocks.length === 0) {
        return "DATOS: No hay productos en inventario.";
      }
      
      const totalProducts = await stockRepository.count();
      
      const LOW_STOCK_THRESHOLD = 10;
      const lowStockProducts = await stockRepository.count({
        where: { quantity: LessThan(LOW_STOCK_THRESHOLD) },
        relations: ['product']
      });
      
      let inventoryContext = `=== INVENTARIO ACTUAL ===

RESUMEN:
• Total de productos diferentes: ${totalProducts}
• Productos con stock bajo: ${lowStockProducts}

LISTA DETALLADA DE PRODUCTOS EN STOCK:
`;

      stocks.forEach(stock => {
        inventoryContext += `
✓ ${stock.product.product_name}:
  • Cantidad disponible: ${stock.quantity} unidades
  • Precio unitario: ${this.formatPrice(stock.product.sale_price)}
  • ID del producto: ${stock.product.product_id}
`;
      });
      
      return inventoryContext;
    } catch (error) {
      console.error('Error getting inventory context:', error);
      return "Error al obtener información de inventario.";
    }
  }
}
