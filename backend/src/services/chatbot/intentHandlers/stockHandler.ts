import { AppDataSource } from '../../../config/ormconfig';
import { Product, StockProduct } from '../../../entities';
// @ts-ignore
import { NlpManager } from 'node-nlp';

const stockProductRepository = AppDataSource.getRepository(StockProduct);
const productRepository = AppDataSource.getRepository(Product);

// Funciones para extracción de entidades
function extractQuantity(query: string): number | null {
  const match = query.match(/(\d+)\s*(de|del|unidades|productos)/i);
  return match ? parseInt(match[1]) : null;
}

function extractProductName(query: string): string {
  // Eliminar palabras comunes y extraer solo el posible nombre del producto
  return query
    .toLowerCase()
    .replace(/precio|valor|costo|total|cuánto|cuanto|cuesta|sale|para|por|del?|la|las|los|unidades|productos|de|hay|stock|inventario/gi, '')
    .trim();
}

// Funciones de búsqueda y similitud
function calculateSimilarity(str1: string, str2: string): number {
  let score = 0;
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word2.includes(word1) || word1.includes(word2)) {
        score += 0.5;
      }
      if (word1 === word2) {
        score += 1;
      }
    }
  }
  
  return score / Math.max(words1.length, words2.length);
}

function findBestProductMatch(products: Product[], searchText: string) {
  const matches = products.map(product => ({
    product,
    similarity: calculateSimilarity(product.product_name.toLowerCase(), searchText)
  }));
  
  return matches.sort((a, b) => b.similarity - a.similarity)[0];
}

// Función utilitaria para encontrar un producto por nombre
async function findProduct(productName: string): Promise<Product | null> {
  const products = await productRepository.find();
  const match = findBestProductMatch(products, productName);
  
  if (match && match.similarity >= 0.6) {
    return match.product;
  }
  return null;
}

// Función para obtener el stock de un producto por ID
async function getProductStock(productId: number): Promise<StockProduct | null> {
  return await stockProductRepository.findOne({
    where: { product: { product_id: productId } },
    relations: ['product']
  });
}

// Funciones para detección de tipos de consulta
function isCalculationQuery(query: string): boolean {
  return /precio|valor|costo|total|cuánto cuesta|cuanto sale|calcular|sumar/i.test(query);
}

function isStockQuery(query: string): boolean {
  return /productos|stock|inventario|disponible|hay/i.test(query);
}

function isCompositeQuery(query: string): boolean {
  return (!!query.match(/disponible|hay stock/i) && !!query.match(/precio|costo|valor/i));
}

// Manejadores específicos por tipo de consulta
async function handleCalculationQuery(query: string): Promise<string> {
  try {
    // Extraer cantidad
    const quantity = extractQuantity(query) || 1;
    
    // Extraer producto
    const productName = extractProductName(query);
    if (!productName) return "No pude identificar qué producto quieres calcular.";
    
    // Buscar producto en la base de datos
    const products = await productRepository.find();
    const match = findBestProductMatch(products, productName);
    
    if (!match || match.similarity < 0.6) {
      return `No encontré ningún producto similar a "${productName}".`;
    }
    
    // Calcular precio
    const subtotal = match.product.sale_price * quantity;
    return `El precio por ${quantity} unidad(es) de ${match.product.product_name} es: $${subtotal.toLocaleString('es-CL')}`;
  } catch (error) {
    console.error("Error en cálculo:", error);
    return "Ocurrió un error al calcular el precio.";
  }
}

async function handleGeneralStockQuery(): Promise<string> {
  const stockProducts = await stockProductRepository.find({
    relations: ['product']
  });

  if (stockProducts.length === 0) {
    return "No hay productos en el inventario.";
  }

  const stockList = stockProducts
    .map(stock => `- ${stock.product.product_name}: ${stock.quantity} unidades`)
    .join('\n');

  return `Productos disponibles en inventario:\n${stockList}`;
}

async function handleSpecificStockQuery(productName: string): Promise<string> {
  try {
    const product = await findProduct(productName);
    if (!product) {
      return `No encontré ningún producto similar a "${productName}".`;
    }
    
    const stock = await getProductStock(product.product_id);
    if (stock) {
      return `Hay ${stock.quantity} unidades de ${product.product_name} en stock.`;
    } else {
      return `No se encontró stock para ${product.product_name}.`;
    }
  } catch (error) {
    console.error("Error en consulta específica:", error);
    return "Ocurrió un error al buscar ese producto.";
  }
}

async function handleCompositeQuery(query: string): Promise<string> {
  // Detectar tipo de operación (precio, disponibilidad, combinación)
  if (isCompositeQuery(query)) {
    // Es una consulta combinada: disponibilidad + precio
    const productName = extractProductName(query);
    const quantity = extractQuantity(query) || 1;
    
    const product = await findProduct(productName);
    if (!product) return `No encontré el producto "${productName}"`;
    
    const stock = await getProductStock(product.product_id);
    
    if (stock && stock.quantity >= quantity) {
      const total = product.sale_price * quantity;
      return `Sí, hay suficiente stock de ${product.product_name} (${stock.quantity} unidades disponibles). 
El precio por ${quantity} unidad(es) sería: $${total.toLocaleString('es-CL')}`;
    } else {
      return `Lo siento, solo tenemos ${stock?.quantity || 0} unidades de ${product.product_name} en stock, 
no es suficiente para tu consulta de ${quantity} unidades.`;
    }
  }
  
  return "No entendí tu consulta. ¿Podrías reformularla?";
}

// Función principal que maneja todas las intenciones de stock
export const handleStockIntent = async (query: string): Promise<string> => {
  try {
    // 1. Verificar primero si es una consulta compuesta
    if (isCompositeQuery(query)) {
      return await handleCompositeQuery(query);
    }
    
    // 2. Verificar si es una consulta de cálculo de precio
    if (isCalculationQuery(query)) {
      return await handleCalculationQuery(query);
    }
    
    // 3. Si es consulta general de inventario
    if (isStockQuery(query) && !extractProductName(query)) {
      return await handleGeneralStockQuery();
    }
    
    // 4. Búsqueda específica de producto
    const productName = extractProductName(query);
    if (productName) {
      return await handleSpecificStockQuery(productName);
    }

    // Respuesta genérica si no se identificó una consulta específica
    return "¿Qué producto específico te gustaría consultar?";
  } catch (error) {
    console.error("Error en handleStockIntent:", error);
    return "Lo siento, hubo un error al procesar tu consulta.";
  }
};
