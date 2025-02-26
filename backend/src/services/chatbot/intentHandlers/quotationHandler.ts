 
import { AppDataSource } from '../../../config/ormconfig';
import { Quotation, WorkProductDetail } from '../../../entities';
import { formatPriceCLP } from '../../../utils/formatPriceCLP';
import { NlpManager } from 'node-nlp';

const manager = new NlpManager({ languages: ['es'] });

// Repositorios
const quotationRepository = AppDataSource.getRepository(Quotation);
const workProductDetailRepository = AppDataSource.getRepository(WorkProductDetail);

// Configurar el NLP manager con las intenciones y expresiones
const setupNlpManager = async () => {
  // Agregar más expresiones de entrenamiento para mejorar la detección
  manager.addDocument('es', 'cuantas cotizaciones hay', 'count');
  manager.addDocument('es', 'número de cotizaciones', 'count');
  manager.addDocument('es', 'total de cotizaciones', 'count');
  manager.addDocument('es', 'cantidad de cotizaciones', 'count');

  manager.addDocument('es', 'cotizaciones pendientes', 'status');
  manager.addDocument('es', 'estado de cotización', 'status');
  manager.addDocument('es', 'cotizaciones aprobadas', 'status');
  manager.addDocument('es', 'cotizaciones rechazadas', 'status');
  manager.addDocument('es', 'en qué estado está', 'status');

  manager.addDocument('es', 'cotización más cara', 'amount');
  manager.addDocument('es', 'cotización más costosa', 'amount');
  manager.addDocument('es', 'precio más alto', 'amount');
  manager.addDocument('es', 'mayor valor', 'amount');
  manager.addDocument('es', 'cuánto cuesta', 'amount');
  manager.addDocument('es', 'cotizacion mas alta', 'amount');

  manager.addDocument('es', 'última cotización', 'date');
  manager.addDocument('es', 'cotización más reciente', 'date');
  manager.addDocument('es', 'cotización nueva', 'date');
  manager.addDocument('es', 'última que se hizo', 'date');

  manager.addDocument('es', 'mostrar cotizaciones', 'list');
  manager.addDocument('es', 'listar cotizaciones', 'list');
  manager.addDocument('es', 'ver todas', 'list');
  manager.addDocument('es', 'muestra las cotizaciones', 'list');

  // Add new training data for lowest amount
  manager.addDocument('es', 'cotización más barata', 'amount_low');
  manager.addDocument('es', 'cotización más económica', 'amount_low');
  manager.addDocument('es', 'precio más bajo', 'amount_low');
  manager.addDocument('es', 'menor valor', 'amount_low');
  manager.addDocument('es', 'más barata', 'amount_low');
  manager.addDocument('es', 'cotizacion mas baja', 'amount_low');

  await manager.train();
};

// Entrenar el modelo inmediatamente
setupNlpManager();

export const handleQuotationIntent = async (query: string, entities?: unknown[]) => {
  try {
    console.log('Processing quotation intent with query:', query);
    
    // Get quotations with query type for proper handling
    const queryType = detectQueryType(query);
    const quotations = await fetchRelevantQuotations(query, queryType);
    console.log(`Processing ${quotations.length} quotations`);

    // Rest of the handler logic based on query type
    switch (queryType) {
      case 'number':
        { const numberMatch = query.match(/(?:cotizacion|cotización)?\s*[#]?(\d+)/i)?.[1];
        return handleNumberQuery(quotations, numberMatch!, query); }
      case 'count':
        return handleCountQuery(quotations, query);
      case 'status':
        return handleStatusQuery(quotations, query);
      case 'client':
        return handleClientQuery(quotations, query, entities as NlpEntity[] | undefined);
      case 'date':
        return handleDateQuery(quotations);
      case 'list':
        return handleListQuery(quotations);
      case 'amount_high':
        return handleAmountQuery(quotations, 'highest');
      case 'amount_low':
        return handleAmountQuery(quotations, 'lowest');
      default:
        return handleDefaultQuery(quotations, query);
    }
  } catch (error) {
    console.error("Error en handleQuotationIntent:", error);
    return "Lo siento, ocurrió un error al consultar las cotizaciones. Por favor, verifica que la base de datos esté conectada correctamente.";
  }
};

/**
 * Detecta el tipo de consulta del usuario.
 * @param query Consulta del usuario.
 * @returns Tipo de consulta.
 */
function detectQueryType(query: string): string {
  const lowercaseQuery = query.toLowerCase();
  
  // Status detection needs to come before count detection
  if (lowercaseQuery.match(/(?:pendiente|aprobada|aceptada|rechazada|estado|aceptadas?|aprobadas?)/i)) {
    return 'status';
  }

  if (lowercaseQuery.match(/(?:cotizacion|cotización)?\s*[#]?(\d+)/i)) return 'number';
  if (lowercaseQuery.match(/cuantas|número|total|cantidad/i)) {
    // If the query also contains status words, it should be a status query
    if (lowercaseQuery.match(/(?:pendiente|aprobada|aceptada|rechazada|aceptadas?|aprobadas?)/i)) {
      return 'status';
    }
    return 'count';
  }
  
  // Improved status detection
  if (lowercaseQuery.match(/(?:pendiente|aprobada|aceptada|rechazada|estado|en\s+pendiente|están?\s+pendientes?|aceptadas?|aprobadas?)/i)) {
    return 'status';
  }
  
  // Improved price-related patterns
  if (query.match(/(?:mas\s+(?:car[ao]|costosa|alta)|mayor\s+(?:valor|precio)|precio\s+(?:alto|mayor))/i)) return 'amount_high';
  if (query.match(/(?:mas\s+(?:barat[ao]|baja|económica)|menor\s+(?:valor|precio)|precio\s+(?:bajo|menor))/i)) return 'amount_low';
  
  // Added specific patterns for common price questions
  if (query.match(/(?:cual|cuál)\s+es\s+la\s+cotizaci[oó]n\s+(?:mas|más)\s+(?:car[ao]|alta)/i)) return 'amount_high';
  if (query.match(/(?:cual|cuál)\s+es\s+la\s+cotizaci[oó]n\s+(?:mas|más)\s+(?:barat[ao]|baja)/i)) return 'amount_low';
  
  return 'default';
}

/**
 * Busca cotizaciones relevantes según la consulta del usuario.
 * @param query Consulta del usuario.
 * @param queryType Tipo de consulta.
 * @returns Lista de cotizaciones relacionadas.
 */
async function fetchRelevantQuotations(query: string, queryType: string) {
  try {
    console.log(`Fetching quotations for query type: ${queryType}`);
    
    const allQuotations = await quotationRepository.find({
      relations: {
        vehicle: {
          owner: true,
          company: true,
          model: {
            brand: true
          }
        }
      }
    });

    console.log(`Found ${allQuotations.length} quotations in total`);

    // Only apply client filtering for client-specific queries
    if (queryType === 'client') {
      const clientName = extractClientName(query);
      if (clientName) {
        console.log(`Filtering by client name: ${clientName}`);
        return allQuotations.filter(q => 
          (q.vehicle?.owner?.name?.toLowerCase() || '').includes(clientName.toLowerCase()) ||
          (q.vehicle?.company?.name?.toLowerCase() || '').includes(clientName.toLowerCase())
        );
      }
    }

    return allQuotations;
  } catch (error) {
    console.error('Error fetching quotations:', error);
    throw new Error('Error al obtener las cotizaciones de la base de datos');
  }
}

/**
 * Detecta el estado solicitado en la consulta.
 * @param query Consulta del usuario.
 * @returns Estado en inglés ('pending', 'approved', 'rejected').
 */
function detectStatusFromQuery(query: string) {
  const lowercaseQuery = query.toLowerCase();
  
  // Improved approved/accepted patterns with word boundaries
  if (lowercaseQuery.match(/\b(?:aprobad[ao]s?|aceptad[ao]s?|aceptadas?|aprobadas?)\b/)) {
    return 'approved';
  }
  
  // Improved rejected patterns with word boundaries
  if (lowercaseQuery.match(/\b(?:rechazad[ao]s?|rechazadas?)\b/)) {
    return 'rejected';
  }
  
  // Improved pending patterns with word boundaries
  if (lowercaseQuery.match(/\b(?:pendientes?|en\s+pendiente|están?\s+pendientes?)\b/)) {
    return 'pending';
  }
  
  // If asking about status generally, return 'all'
  if (lowercaseQuery.match(/\b(?:estado|estatus)\b/)) {
    return 'all';
  }
  
  return 'all'; // Changed default to 'all' to be more inclusive
}

/**
 * Maneja consultas sobre la cantidad de cotizaciones.
 * @param quotations Lista de cotizaciones.
 * @returns Respuesta con el conteo.
 */
function handleCountQuery(quotations: Quotation[], query: string) {
  // Check if the query is about a specific status
  const statusMatch = query.toLowerCase().match(/(?:pendiente|aprobada|aceptada|rechazada|aceptadas?|aprobadas?)/i);
  if (statusMatch) {
    const status = detectStatusFromQuery(query);
    const filteredQuotations = quotations.filter(q => q.quotation_Status === status);
    const count = filteredQuotations.length;
    const noun = count === 1 ? 'cotización' : 'cotizaciones';
    const statusText = status === 'approved' ? 'aprobada' : 
                      status === 'rejected' ? 'rechazada' : 'pendiente';
    return `Hay ${count} ${noun} ${statusText}${count !== 1 ? 's' : ''}.`;
  }

  const count = quotations.length;
  const noun = count === 1 ? 'cotización' : 'cotizaciones';
  return `Hay ${count} ${noun} en total.`;
}

/**
 * Maneja consultas sobre el estado de las cotizaciones.
 * @param quotations Lista de cotizaciones.
 * @param query Consulta del usuario.
 * @returns Respuesta con el estado de las cotizaciones.
 */
function handleStatusQuery(quotations: Quotation[], query: string) {
  const status = detectStatusFromQuery(query);
  
  // If status is 'all', show all statuses
  if (status === 'all') {
    const pending = quotations.filter(q => q.quotation_Status === 'pending').length;
    const approved = quotations.filter(q => q.quotation_Status === 'approved').length;
    const rejected = quotations.filter(q => q.quotation_Status === 'rejected').length;
    
    return `Estado de las cotizaciones:\n` +
           `- Pendientes: ${pending}\n` +
           `- Aprobadas: ${approved}\n` +
           `- Rechazadas: ${rejected}`;
  }

  const filteredQuotations = quotations.filter(q => q.quotation_Status === status);
  const count = filteredQuotations.length;
  
  if (count === 0) {
    const statusText = status === 'approved' ? 'aprobadas' : 
                      status === 'rejected' ? 'rechazadas' : 'pendientes';
    return `No hay cotizaciones ${statusText}.`;
  }

  const statusText = status === 'approved' ? 'aprobadas' : 
                    status === 'rejected' ? 'rechazadas' : 'pendientes';

  return `Hay ${count} cotización${count !== 1 ? 'es' : ''} ${statusText}:\n` +
    filteredQuotations.map(q =>
      `- Cotización #${q.quotation_id} ` +
      `(${q.vehicle?.owner?.name || q.vehicle?.company?.name || 'No especificado'}) - ` +
      `${q.total_price ? formatPriceCLP(q.total_price) : 'Sin monto'}`
    ).join('\n');
}

/**
 * Maneja consultas sobre el monto más alto o más bajo de las cotizaciones.
 * @param quotations Lista de cotizaciones.
 * @param type Tipo de consulta ('highest' o 'lowest').
 * @returns Respuesta con la cotización más cara o más barata.
 */
function handleAmountQuery(quotations: Quotation[], type: 'highest' | 'lowest' = 'highest') {
  if (quotations.length === 0) return "No hay cotizaciones registradas.";

  const quotation = quotations.reduce((result, current) => {
    if (type === 'highest') {
      return (current.total_price || 0) > (result.total_price || 0) ? current : result;
    } else {
      return (current.total_price || 0) < (result.total_price || 0) ? current : result;
    }
  });

  const descriptor = type === 'highest' ? 'más alta' : 'más baja';
  return `La cotización ${descriptor} es la #${quotation.quotation_id}:\n` +
    `Cliente: ${quotation.vehicle?.owner?.name || quotation.vehicle?.company?.name || 'No especificado'}\n` +
    `Monto: ${quotation.total_price ? formatPriceCLP(quotation.total_price) : 'Sin monto'}\n` +
    `Vehículo: ${quotation.vehicle?.model?.brand?.brand_name} ${quotation.vehicle?.model?.model_name}`;
}

/**
 * Maneja consultas sobre la cotización más reciente.
 * @param quotations Lista de cotizaciones.
 * @returns Respuesta con detalles de la cotización más reciente.
 */
function handleDateQuery(quotations: Quotation[]) {
  if (quotations.length === 0) return "No hay cotizaciones registradas.";

  const latest = quotations.reduce((prev, current) =>
    new Date(current.entry_date).getTime() > new Date(prev.entry_date).getTime() ? current : prev
  );

  return formatDetailedQuotation(latest);
}

/**
 * Maneja consultas para listar todas las cotizaciones.
 * @param quotations Lista de cotizaciones.
 * @returns Respuesta con la lista de cotizaciones.
 */
function handleListQuery(quotations: Quotation[]) {
  if (quotations.length === 0) return "No se encontraron cotizaciones.";

  const sortedQuotations = [...quotations].sort((a, b) =>
    new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
  );

  return `Se encontraron ${quotations.length} cotizaciones:\n` +
    sortedQuotations.map(q =>
      `- Cotización #${q.quotation_id} del cliente ${q.vehicle?.owner?.name || 'No especificado'} ` +
      `(${new Date(q.entry_date).toLocaleDateString()})`
    ).join('\n');
}

/**
 * Formatea los detalles completos de una cotización.
 * @param quotation Cotización a formatear.
 * @returns Detalles formateados como string.
 */
async function formatDetailedQuotation(quotation: Quotation) {
  try {
    console.log(`Fetching details for quotation #${quotation.quotation_id}`);
    
    const workProductDetails = await workProductDetailRepository.find({
      where: { quotation: { quotation_id: quotation.quotation_id } },
      relations: ['product']
    });

    console.log(`Found ${workProductDetails.length} product details`);

    const details = workProductDetails.map(detail =>
      `- ${detail.product.product_name}: ${detail.quantity} x ${formatPriceCLP(detail.sale_price)}`
    ).join('\n') || 'Sin detalles';

    return `
Cotización #${quotation.quotation_id}

Cliente: ${quotation.vehicle?.owner?.name || quotation.vehicle?.company?.name || 'No especificado'}
Vehículo: ${quotation.vehicle?.model?.brand?.brand_name} ${quotation.vehicle?.model?.model_name}
Estado: ${quotation.quotation_Status}
Fecha: ${new Date(quotation.entry_date).toLocaleDateString()}

Detalles:
${details}

Total: ${quotation.total_price ? formatPriceCLP(quotation.total_price) : 'Sin monto'}
`;
  } catch (error) {
    console.error('Error formatting quotation details:', error);
    return `Error al obtener los detalles de la cotización #${quotation.quotation_id}`;
  }
}

/**
 * Maneja consultas sobre un número de cotización específico.
 * @param quotations Lista de cotizaciones.
 * @param number Número de cotización.
 * @param query Consulta del usuario.
 * @returns Respuesta con detalles o costo de la cotización.
 */
function handleNumberQuery(quotations: Quotation[], number: string, query: string) {
  console.log(`Searching for quotation #${number}`);
  const quotation = quotations.find(q => q.quotation_id === parseInt(number));
  
  if (!quotation) {
    return `No se encontró la cotización #${number}. Total de cotizaciones disponibles: ${quotations.length}`;
  }

  if (query.match(/(costo|precio|valor|monto|total)/i)) {
    return `El costo de la cotización #${quotation.quotation_id} es: ${formatPriceCLP(quotation.total_price || 0)}`;
  }

  return formatDetailedQuotation(quotation);
}

/**
 * Calcula la similitud entre dos cadenas de texto usando la distancia de Levenshtein.
 * @param str1 Primera cadena de texto.
 * @param str2 Segunda cadena de texto.
 * @returns Puntaje de similitud entre 0 y 1.
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  // Convertir a minúsculas para una mejor coincidencia
  str1 = str1.toLowerCase();
  str2 = str2.toLowerCase();
  
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;
  
  const matrix = [];
  
  // Inicializar la matriz
  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = j;
  }
  
  // Llenar la matriz
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1[i-1] === str2[j-1]) {
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i-1][j-1] + 1,
          matrix[i][j-1] + 1,
          matrix[i-1][j] + 1
        );
      }
    }
  }
  
  // Calcular el puntaje de similitud
  const distance = matrix[str1.length][str2.length];
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
}

/**
 * Maneja consultas por defecto cuando no se detecta una intención clara.
 * @param quotations Lista de cotizaciones.
 * @param query Consulta del usuario.
 * @returns Respuesta con detalles o lista de cotizaciones.
 */
function handleDefaultQuery(quotations: Quotation[], query: string) {
  const clientNameSimilarity = quotations.map(q => ({
    quotation: q,
    similarity: calculateStringSimilarity(
      q.vehicle?.owner?.name || '',
      query
    )
  }));

  const bestMatch = clientNameSimilarity.find(m => m.similarity > 0.7);
  if (bestMatch) {
    return formatDetailedQuotation(bestMatch.quotation);
  }

  return `No pude entender tu consulta. Prueba preguntando por:\n` +
         `- Número de cotización (ej: "cotización #1")\n` +
         `- Estado de cotizaciones\n` +
         `- Cotizaciones recientes\n` +
         `- Cotización más cara\n` +
         `- Lista de cotizaciones`;
}

/**
 * Checks if a word is a common word that should be ignored
 * @param word Word to check
 * @returns True if the word is common, false otherwise
 */
function isCommonWord(word: string): boolean {
  const commonWords = [
    'es', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'cotización', 'cotizacion', 'cotizaciones',
    'cual', 'cuál', 'que', 'qué', 'donde', 'dónde',
    'cuando', 'cuándo', 'como', 'cómo'
  ];
  return commonWords.includes(word.toLowerCase());
}

/**
 * Extrae el nombre del cliente de la consulta.
 * @param query Consulta del usuario.
 * @returns Nombre del cliente o null si no se encuentra.
 */
function extractClientName(query: string): string | null {
  const clientMatch = query.match(/(?:cliente|sr\.|sra\.|señor|señora)\s+([A-ZÁ-Úá-úa-z]+)/i);
  return clientMatch ? clientMatch[1] : null;
}

// Add new function to check if an entity should be ignored as client name


/**
 * Maneja consultas específicas de clientes
 * @param quotations Lista de cotizaciones
 * @param query Consulta del usuario
 * @param entities Entidades detectadas
 * @returns Respuesta con las cotizaciones del cliente
 */
interface NlpEntity {
  entity: string;
  utteranceText: string;
}

function handleClientQuery(quotations: Quotation[], query: string, entities?: NlpEntity[]) {
  const clientName = extractClientName(query) || 
                    entities?.find(e => e.entity === 'clientName')?.utteranceText;

  if (!clientName || isCommonWord(clientName)) {
    return handleDefaultQuery(quotations, query);
  }

  const clientQuotations = quotations.filter(q => 
    (q.vehicle?.owner?.name?.toLowerCase() || '').includes(clientName.toLowerCase()) ||
    (q.vehicle?.company?.name?.toLowerCase() || '').includes(clientName.toLowerCase())
  );

  if (clientQuotations.length === 0) {
    return `No se encontraron cotizaciones para el cliente "${clientName}".`;
  }

  if (clientQuotations.length === 1) {
    return formatDetailedQuotation(clientQuotations[0]);
  }

  return `Encontré ${clientQuotations.length} cotizaciones para ${clientName}:\n` +
    clientQuotations.map(q => 
      `- Cotización #${q.quotation_id} (${new Date(q.entry_date).toLocaleDateString()}) - ${formatPriceCLP(q.total_price || 0)}`
    ).join('\n');
}