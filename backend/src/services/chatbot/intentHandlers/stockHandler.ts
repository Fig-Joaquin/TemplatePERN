import { AppDataSource } from '../../../config/ormconfig';
import { Product, StockProduct } from '../../../entities';
import { NlpManager } from 'node-nlp';

const manager = new NlpManager({ languages: ['es'] });
const stockProductRepository = AppDataSource.getRepository(StockProduct);
const productRepository = AppDataSource.getRepository(Product);

export const handleStockIntent = async (query: string): Promise<string> => {
    try {
        const stockProducts = await stockProductRepository.find({
            relations: ['product']
        });

        if (query.match(/productos|stock|inventario/i)) {
            if (stockProducts.length === 0) {
                return "No hay productos en el inventario.";
            }

            const stockList = stockProducts
                .map(stock => `- ${stock.product.product_name}: ${stock.quantity} unidades`)
                .join('\n');

            return `Productos disponibles en inventario:\n${stockList}`;
        }

        // Búsqueda específica de producto
        const productName = query.toLowerCase().replace(/hay|stock|inventario|productos?|de|del?|la|las|los/g, '').trim();
        if (productName) {
            const products = await productRepository.find();
            const productMatches = products.map(product => ({
                product,
                similarity: manager.calculateSimilarity(
                    product.product_name.toLowerCase(),
                    productName
                )
            }));

            const bestMatch = productMatches.reduce((prev, current) => 
                prev.similarity > current.similarity ? prev : current
            );

            if (bestMatch.similarity > 0.6) {
                const stock = stockProducts.find(s => s.product.product_id === bestMatch.product.product_id);
                if (stock) {
                    return `Hay ${stock.quantity} unidades de ${stock.product.product_name} en stock.`;
                }
                return `No se encontró stock para ${bestMatch.product.product_name}.`;
            }
        }

        return "¿Qué producto específico te gustaría consultar?";
    } catch (error) {
        console.error("Error en handleStockIntent:", error);
        return "Lo siento, hubo un error al consultar el inventario.";
    }
};
