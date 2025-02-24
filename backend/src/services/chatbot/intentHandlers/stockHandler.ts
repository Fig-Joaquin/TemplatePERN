import { AppDataSource } from '../../../config/ormconfig';
import { Product, StockProduct } from '../../../entities';
import natural from 'natural';

const stockProductRepository = AppDataSource.getRepository(StockProduct);
const productRepository = AppDataSource.getRepository(Product);

// services/chatbot/intentHandlers/stockHandler.ts
export const handleStockIntent = async (query: string) => {
    const products = await productRepository.find({ relations: ['stock'] });
    
    const productMatches = products.map(product => ({
      product,
      similarity: natural.JaroWinklerDistance(
        product.product_name.toLowerCase(),
        query.toLowerCase()
      )
    }));
  
    const bestMatch = productMatches.reduce((prev, current) => 
      prev.similarity > current.similarity ? prev : current
    );
  
    if (bestMatch.similarity > 0.6) {
      const stock = await stockProductRepository.findOne({
        where: { product: { product_id: bestMatch.product.product_id } },
        relations: ['product']
      });
  
      if (stock) {
        return `Quedan ${stock.quantity} unidades de ${bestMatch.product.product_name} en stock.`;
      }
    }
    return null;
  };
