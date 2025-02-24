import { AppDataSource } from '../../../config/ormconfig';
import { WorkOrder } from '../../../entities';
import natural from 'natural';

const workOrderRepository = AppDataSource.getRepository(WorkOrder);

const intentSynonyms = {
    count: ['cuantas', 'cantidad', 'numero', 'número'],
    status: ['estado', 'pendiente', 'proceso', 'terminada', 'finalizada', 'aprobada'],
    amount: ['precio', 'valor', 'costo', 'monto', 'total', 'mayor'],
    date: ['fecha', 'reciente', 'nueva', 'última', 'actual', 'hoy'],
    list: ['listar', 'mostrar', 'ver', 'todas', 'disponibles']
};

export const handleWorkOrderIntent = async (query: string) => {
    try {
        const lowercaseQuery = query.toLowerCase();
        const orderNumberMatch = query.match(/\d+/)?.[0];
        const workOrders = await fetchRelevantWorkOrders(lowercaseQuery);

        const intent = detectQueryIntent(lowercaseQuery);

        switch (intent) {
            case 'count':
                return handleCountQuery(workOrders);
            case 'status':
                return handleStatusQuery(workOrders);
            case 'amount':
                return handleAmountQuery(workOrders);
            case 'date':
                return handleDateQuery(workOrders);
            case 'list':
                return handleListQuery(workOrders);
            default:
                if (orderNumberMatch) return handleNumberQuery(workOrders, orderNumberMatch);
                if (isClientNameQuery(lowercaseQuery)) return handleClientNameQuery(workOrders, lowercaseQuery);
                return `No encontré órdenes de trabajo que coincidan con "${query}". 
Puedes buscar por número de orden o nombre del cliente.`;
        }
    } catch (error) {
        console.error("Error buscando órdenes de trabajo:", error);
        return "Lo siento, hubo un error al buscar las órdenes de trabajo.";
    }
};

async function fetchRelevantWorkOrders(query: string) {
    let baseQuery = workOrderRepository
        .createQueryBuilder('workOrder')
        .leftJoinAndSelect('workOrder.vehicle', 'vehicle')
        .leftJoinAndSelect('vehicle.owner', 'owner')
        .leftJoinAndSelect('vehicle.company', 'company');

    if (query.includes('pendiente') || query.includes('estado')) {
        baseQuery = baseQuery.where('workOrder.order_status = :status', { status: 'pending' });
    }
    return baseQuery.getMany();
}

function handleCountQuery(workOrders: WorkOrder[]) {
    return `Hay ${workOrders.length} órdenes de trabajo.`;
}

function handleStatusQuery(workOrders: WorkOrder[]) {
    const pendingOrders = workOrders.filter(order => order.order_status === 'pending');
    return pendingOrders.length > 0
        ? `Hay ${pendingOrders.length} órdenes de trabajo pendientes:\n` +
          pendingOrders.map(order => `- Orden #${order.work_order_id} (${order.vehicle?.owner?.name || 'Sin cliente'})`).join('\n')
        : "No hay órdenes de trabajo pendientes actualmente.";
}

function handleAmountQuery(workOrders: WorkOrder[]) {
    const highest = workOrders.reduce((max, current) =>
        (current.total_amount || 0) > (max.total_amount || 0) ? current : max
    );
    return `La orden de trabajo con mayor monto es la #${highest.work_order_id}:\n` +
        `Cliente: ${highest.vehicle?.owner?.name || 'No especificado'}\n` +
        `Estado: ${highest.order_status}\n` +
        `Total: $${highest.total_amount ? highest.total_amount.toLocaleString('es-CL') : 0}`;
}

function handleDateQuery(workOrders: WorkOrder[]) {
    // Se asume que existe la propiedad "entry_date" en WorkOrder.
    const latest = workOrders.reduce((prev, current) =>
        new Date(current.order_date).getTime() > new Date(prev.order_date).getTime() ? current : prev
    );
    return `La orden de trabajo más reciente es la #${latest.work_order_id}:\n` +
        `Cliente: ${latest.vehicle?.owner?.name || 'No especificado'}\n` +
        `Fecha: ${new Date(latest.order_date).toLocaleDateString()}\n` +
        `Estado: ${latest.order_status}`;
}

function handleListQuery(workOrders: WorkOrder[]) {
    return workOrders.length > 0
        ? `Se encontraron ${workOrders.length} órdenes de trabajo:\n` +
          workOrders.map(order => `- Orden #${order.work_order_id} del cliente ${order.vehicle?.owner?.name || 'Sin cliente'}`).join('\n')
        : "No se encontraron órdenes de trabajo.";
}

function handleNumberQuery(workOrders: WorkOrder[], number: string) {
    const order = workOrders.find(o => o.work_order_id === parseInt(number));
    return order
        ? `Orden de trabajo #${order.work_order_id}:\n` +
          `Cliente: ${order.vehicle?.owner?.name || 'No especificado'}\n` +
          `Empresa: ${order.vehicle?.company?.name || 'No especificada'}\n` +
          `Estado: ${order.order_status}\n` +
          `Total: $${order.total_amount ? order.total_amount.toLocaleString('es-CL') : 0}`
        : `No se encontró la orden de trabajo #${number}.`;
}

function handleClientNameQuery(workOrders: WorkOrder[], query: string) {
    //const querySound = new natural.Metaphone().process(query);
    const matches = workOrders.map(order => ({
        order,
        similarity: natural.JaroWinklerDistance(
            (order.vehicle?.owner?.name || '').toLowerCase(),
            query.toLowerCase()
        )
    }));

    const bestMatches = matches
        .filter(m => m.similarity > 0.7)
        .sort((a, b) => b.similarity - a.similarity);

    if (bestMatches.length > 0) {
        const order = bestMatches[0].order;
        return `Última orden de trabajo para ${order.vehicle?.owner?.name}:\n` +
            `Orden #${order.work_order_id}\n` +
            `Estado: ${order.order_status}\n` +
            `Total: $${order.total_amount ? order.total_amount.toLocaleString('es-CL') : 0}`;
    }
    return "No se encontraron coincidencias por nombre de cliente.";
}

function isClientNameQuery(query: string) {
    return !query.match(/\d+/);
}

function calculateQueryScore(query: string, keywords: string[]) {
    return keywords.reduce((score, keyword) => {
        if (query.includes(keyword)) score += 1;
        if (query.startsWith(keyword)) score += 0.5;
        if (natural.JaroWinklerDistance(query, keyword) > 0.8) score += 0.3;
        return score;
    }, 0);
}

function detectQueryIntent(query: string) {
    const scores = {
        count: calculateQueryScore(query, intentSynonyms.count),
        status: calculateQueryScore(query, intentSynonyms.status),
        amount: calculateQueryScore(query, intentSynonyms.amount),
        date: calculateQueryScore(query, intentSynonyms.date),
        list: calculateQueryScore(query, intentSynonyms.list)
    };

    const bestIntent = Object.entries(scores).reduce(
        (best, [intent, score]) => score > best.score ? { intent, score } : best,
        { intent: 'unknown', score: 0 }
    );

    return bestIntent.score > 0.5 ? bestIntent.intent : 'unknown';
}