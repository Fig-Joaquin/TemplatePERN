import { AppDataSource } from '../../../config/ormconfig';
import { Quotation, WorkProductDetail } from '../../../entities';
import { formatPriceCLP } from '../../../utils/formatPriceCLP';
import natural from 'natural';

// Repositorios para acceder a las entidades de la base de datos
const quotationRepository = AppDataSource.getRepository(Quotation);
const workProductDetailRepository = AppDataSource.getRepository(WorkProductDetail);

// Sinónimos ampliados para detectar intenciones del usuario
const intentSynonyms = {
  count: ['cuantas', 'cantidad', 'numero', 'número', 'total de', 'cuántas', 'cuantos', 'cuántos'],
  status: ['estado', 'pendiente', 'proceso', 'terminada', 'finalizada', 'aprobada', 'rechazada', 'situación', 'aprobadas', 'rechazadas'],
  amount: ['precio', 'valor', 'costo', 'monto', 'total', 'cara', 'mayor', 'vale', 'cuesta', 'cuanto', 'cuánto', 'más alta', 'más cara'],
  date: [
    'fecha', 'reciente', 'nueva', 'última', 'actual', 'hoy', 'más nueva', 'más reciente', 'ultima cotización', 'última cotización',
    'cual es la ultima', 'cual es la más reciente', 'cuál es la última', 'cuál es la más reciente'
  ],
  list: ['listar', 'mostrar', 'ver', 'todas', 'disponibles', 'lista', 'enumerar'],
  details: ['cual', 'cuál', 'detalle', 'información', 'info', 'detalles', 'describe', 'especifica', 'dime sobre'],
  create: ['crear', 'nueva', 'agregar', 'hacer', 'generar', 'nuevo', 'añadir']
};

/**
 * Maneja la intención de la consulta del usuario.
 * @param query Consulta del usuario en texto.
 * @returns Respuesta del chatbot como string.
 */
export const handleQuotationIntent = async (query: string) => {
  try {
    const lowercaseQuery = query.toLowerCase();

    // Detectar número de cotización específico
    const numberMatch = lowercaseQuery.match(/(?:cotizacion|cotización)?\s*[#]?(\d+)/i)?.[1]
      || lowercaseQuery.match(/[#](\d+)/)?.[1];

    if (numberMatch) {
      const quotations = await fetchRelevantQuotations(lowercaseQuery);
      const quotation = quotations.find(q => q.quotation_id === parseInt(numberMatch));

      if (lowercaseQuery.match(/(costo|precio|valor|monto|total)/i)) {
        return quotation
          ? `El costo de la cotización #${quotation.quotation_id} es: ${formatPriceCLP(quotation.total_price || 0)}`
          : `No se encontró la cotización #${numberMatch}`;
      }

      return quotation
        ? await formatDetailedQuotation(quotation)
        : `No se encontró la cotización #${numberMatch}`;
    }

    const quotations = await fetchRelevantQuotations(lowercaseQuery);
    const intent = detectQueryIntent(lowercaseQuery);

    switch (intent) {
      case 'count':
        return handleCountQuery(quotations);
      case 'status':
        return handleStatusQuery(quotations, lowercaseQuery);
      case 'amount':
        return handleAmountQuery(quotations);
      case 'date':
        return handleDateQuery(quotations);
      case 'list':
        return handleListQuery(quotations);
      case 'details':
        return handleDetailQuery(quotations, lowercaseQuery);
      case 'create':
        return handleCreateQuery();
      default:
        if (isClientNameQuery(lowercaseQuery)) {
          return handleClientNameQuery(quotations, lowercaseQuery);
        }
        return `No encontré cotizaciones que coincidan con "${query}".\nPrueba preguntando por:\n - Número de cotización (ej: "cotización #1")\n- Costo de una cotización (ej: "cuánto vale la cotización 1")\n- Nombre del cliente\n- Cotizaciones pendientes\n- Cotización más reciente`;
    }
  } catch (error) {
    console.error("Error buscando cotizaciones:", error);
    return "Lo siento, hubo un error al buscar las cotizaciones.";
  }
};

/**
 * Busca cotizaciones relevantes según la consulta del usuario.
 * @param query Consulta del usuario.
 * @returns Lista de cotizaciones relacionadas.
 */
async function fetchRelevantQuotations(query: string) {
  const baseQuery = quotationRepository
    .createQueryBuilder('quotation')
    .leftJoinAndSelect('quotation.vehicle', 'vehicle')
    .leftJoinAndSelect('vehicle.owner', 'owner')
    .leftJoinAndSelect('vehicle.company', 'company')
    .leftJoinAndSelect('vehicle.model', 'model')
    .leftJoinAndSelect('model.brand', 'brand');

  if (query.includes('pendiente') || query.includes('aprobada') || query.includes('rechazada') || query.includes('estado')) {
    return baseQuery
      .where('quotation.quotation_Status = :status', { status: detectStatusFromQuery(query) })
      .getMany();
  }

  return baseQuery.getMany();
}

/**
 * Detecta el estado solicitado en la consulta.
 * @param query Consulta del usuario.
 * @returns Estado en inglés ('pending', 'approved', 'rejected').
 */
function detectStatusFromQuery(query: string) {
  if (query.includes('aprobada')) return 'approved';
  if (query.includes('rechazada')) return 'rejected';
  return 'pending'; // Por defecto, pendiente
}

/**
 * Maneja consultas sobre la cantidad de cotizaciones.
 * @param quotations Lista de cotizaciones.
 * @returns Respuesta con el conteo.
 */
function handleCountQuery(quotations: Quotation[]) {
  const count = quotations.length;
  const noun = count === 1 ? 'cotización' : 'cotizaciones';
  return `Hay ${count} ${noun}.`;
}

/**
 * Maneja consultas sobre el estado de las cotizaciones.
 * @param quotations Lista de cotizaciones.
 * @param query Consulta del usuario.
 * @returns Respuesta con el estado de las cotizaciones.
 */
function handleStatusQuery(quotations: Quotation[], query: string) {
  const status = detectStatusFromQuery(query);
  const filteredQuotations = quotations.filter(q => q.quotation_Status === status);
  const count = filteredQuotations.length;
  const noun = count === 1 ? 'cotización' : 'cotizaciones';
  const statusText = status === 'pending' ? 'pendientes' : status === 'approved' ? 'aprobadas' : 'rechazadas';

  if (count === 0) {
    return `No hay cotizaciones ${statusText}.`;
  }

  return `Hay ${count} ${noun} ${statusText}:\n` +
    filteredQuotations.map(q =>
      `- Cotización #${q.quotation_id} (${q.vehicle?.owner?.name}) - ${q.total_price ? formatPriceCLP(q.total_price) : 'Sin monto'}`
    ).join('\n');
}

/**
 * Maneja consultas sobre el monto más alto de las cotizaciones.
 * @param quotations Lista de cotizaciones.
 * @returns Respuesta con la cotización más cara.
 */
function handleAmountQuery(quotations: Quotation[]) {
  if (quotations.length === 0) return "No hay cotizaciones registradas.";

  const highest = quotations.reduce((max, current) =>
    (current.total_price || 0) > (max.total_price || 0) ? current : max
  );

  return `La cotización más alta es la #${highest.quotation_id}:\n` +
    `Cliente: ${highest.vehicle?.owner?.name || highest.vehicle?.company?.name || 'No especificado'}\n` +
    `Monto: ${highest.total_price ? formatPriceCLP(highest.total_price) : 'Sin monto'}\n` +
    `Vehículo: ${highest.vehicle?.model?.brand?.brand_name} ${highest.vehicle?.model?.model_name}`;
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
 * Maneja consultas por nombre de cliente.
 * @param quotations Lista de cotizaciones.
 * @param query Consulta del usuario.
 * @returns Respuesta con detalles de la cotización del cliente.
 */
function handleClientNameQuery(quotations: Quotation[], query: string) {
  const matches = quotations.map(q => {
    const ownerName = (q.vehicle?.owner?.name || '').toLowerCase();
    let similarity = natural.JaroWinklerDistance(ownerName, query);
    if (query.includes(ownerName) && ownerName) {
      similarity = 1; // Prioriza coincidencias exactas
    }
    return { quotation: q, similarity };
  });

  const bestMatches = matches
    .filter(m => m.similarity > 0.8)
    .sort((a, b) => b.similarity - a.similarity);

  if (bestMatches.length > 0) {
    return formatDetailedQuotation(bestMatches[0].quotation);
  }

  return "No se encontraron coincidencias por nombre de cliente.";
}

/**
 * Maneja consultas sobre cómo crear una cotización.
 * @returns Respuesta con instrucciones básicas.
 */
function handleCreateQuery() {
  return "Para crear una nueva cotización, por favor proporciona los detalles del cliente y del vehículo.";
}

/**
 * Formatea los detalles completos de una cotización.
 * @param quotation Cotización a formatear.
 * @returns Detalles formateados como string.
 */
async function formatDetailedQuotation(quotation: Quotation) {
  const workProductDetails = await workProductDetailRepository.find({
    where: { quotation: { quotation_id: quotation.quotation_id } },
    relations: ["product"],
  });

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
}

/**
 * Verifica si la consulta es sobre un nombre de cliente.
 * @param query Consulta del usuario.
 * @returns True si no contiene números (probable nombre).
 */
function isClientNameQuery(query: string) {
  return !query.match(/\d+/);
}

/**
 * Calcula la puntuación de similitud entre la consulta y las palabras clave.
 * @param query Consulta del usuario.
 * @param keywords Lista de sinónimos para una intención.
 * @returns Puntuación numérica.
 */
function calculateQueryScore(query: string, keywords: string[]) {
  return keywords.reduce((score, keyword) => {
    if (query.includes(keyword)) score += 1;
    if (query.startsWith(keyword)) score += 0.5;
    if (natural.JaroWinklerDistance(query, keyword) > 0.8) score += 0.3;
    return score;
  }, 0);
}

/**
 * Detecta la intención principal de la consulta del usuario.
 * @param query Consulta del usuario.
 * @returns Intención detectada o 'unknown'.
 */
function detectQueryIntent(query: string) {
  const recentQueries = [
    'cual es la cotización',
    'cuál es la cotización',
    'que cotización',
    'qué cotización'
  ];

  if (recentQueries.some(q => query.includes(q)) &&
      (query.includes('reciente') || query.includes('última') || query.includes('ultima'))) {
    return 'date';
  }

  const scores = {
    count: calculateQueryScore(query, intentSynonyms.count),
    status: calculateQueryScore(query, intentSynonyms.status),
    amount: calculateQueryScore(query, intentSynonyms.amount),
    date: calculateQueryScore(query, intentSynonyms.date),
    list: calculateQueryScore(query, intentSynonyms.list),
    details: calculateQueryScore(query, intentSynonyms.details),
    create: calculateQueryScore(query, intentSynonyms.create)
  };

  const bestIntent = Object.entries(scores)
    .reduce((best, [intent, score]) =>
      score > best.score ? { intent, score } : best,
      { intent: 'unknown', score: 0 }
    );

  return bestIntent.score > 0.5 ? bestIntent.intent : 'unknown';
}

/**
 * Maneja consultas detalladas sobre una cotización específica.
 * @param quotations Lista de cotizaciones.
 * @param query Consulta del usuario.
 * @returns Respuesta con detalles o lista.
 */
function handleDetailQuery(quotations: Quotation[], query: string) {
  const numberMatch = query.match(/\d+/)?.[0];
  if (numberMatch) {
    const quotation = quotations.find(q => q.quotation_id === parseInt(numberMatch));
    return quotation
      ? formatDetailedQuotation(quotation)
      : `No se encontró la cotización #${numberMatch}`;
  }
  return handleListQuery(quotations);
}