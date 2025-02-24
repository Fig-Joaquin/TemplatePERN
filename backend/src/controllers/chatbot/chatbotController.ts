// backend/src/controllers/chatbotController.ts
import { AppDataSource } from "../../config/ormconfig";
import { Product, StockProduct } from "../../entities";
import { Request, Response } from "express";
import natural from "natural";

const stockProductRepository = AppDataSource.getRepository(StockProduct);
const productRepository = AppDataSource.getRepository(Product);

// Tokenizer para español
const tokenizer = new natural.AggressiveTokenizerEs();

export const handleChatQuery = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query } = req.body;

        // Tokenizar la pregunta
        const tokens = tokenizer.tokenize(query.toLowerCase());

        // Detectar intención (stock query)
        if (tokens.some(token => ['stock', 'cantidad', 'quedan', 'hay', 'disponible'].includes(token))) {
            // Buscar nombre de producto en la consulta
            const products = await productRepository.find({ relations: ['stock'] });
            
            // Encontrar el producto más similar en la consulta
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

            if (bestMatch.similarity > 0.6) { // Umbral de similitud
                const stock = await stockProductRepository.findOne({
                    where: { product: { product_id: bestMatch.product.product_id } },
                    relations: ['product']
                });

                if (stock) {
                    res.json({
                        response: `Quedan ${stock.quantity} unidades de ${bestMatch.product.product_name} en stock.`
                    });
                    return;
                }
            }
        }

        // Respuesta por defecto
        res.json({
            response: "Lo siento, no pude entender tu consulta. Por favor, reformula la pregunta."
        });

    } catch (error) {
        res.status(500).json({ message: "Error procesando la consulta", error });
    }
};