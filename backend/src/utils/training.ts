import { nlpManager } from '../services/chatbot/nlpManager';

export const setupTraining = async () => {
    console.log('Starting NLP training...');

    // Entrenamiento para cotizaciones
    nlpManager.addDocument('quotation', 'que cotizaciones hay');
    nlpManager.addDocument('quotation', 'mostrar cotizaciones');
    nlpManager.addDocument('quotation', 'cuantas cotizaciones tenemos');
    nlpManager.addDocument('quotation', 'ver cotizaciones');
    nlpManager.addDocument('quotation', 'lista de cotizaciones');
    nlpManager.addDocument('quotation', 'necesito una cotización');
    nlpManager.addDocument('quotation', 'cotizaciones pendientes');
    nlpManager.addDocument('quotation', 'cotizaciones disponibles');
    nlpManager.addDocument('quotation', 'quiero cotizar un servicio');
    nlpManager.addDocument('quotation', 'dame el precio de');
    nlpManager.addDocument('quotation', 'cuánto cuesta');
    nlpManager.addDocument('quotation', 'precio aproximado');
    nlpManager.addDocument('quotation', 'presupuesto para');
    nlpManager.addDocument('quotation', 'cotización más reciente');
    nlpManager.addDocument('quotation', 'última cotización');
    nlpManager.addDocument('quotation', 'cotización más cara');
    nlpManager.addDocument('quotation', 'cotizaciones de hoy');
    nlpManager.addDocument('quotation', 'buscar cotización');
    nlpManager.addDocument('quotation', 'estado de mi cotización');
    nlpManager.addDocument('quotation', 'cotización número');

    // Entrenamiento para stock
    nlpManager.addDocument('stock', 'revisar stock');
    nlpManager.addDocument('stock', 'verificar inventario');
    nlpManager.addDocument('stock', 'productos disponibles');
    nlpManager.addDocument('stock', 'stock actual');
    nlpManager.addDocument('stock', 'hay stock de');
    nlpManager.addDocument('stock', 'queda producto');
    nlpManager.addDocument('stock', 'disponibilidad de');
    nlpManager.addDocument('stock', 'inventario actual');
    nlpManager.addDocument('stock', 'productos en bodega');
    nlpManager.addDocument('stock', 'cantidad disponible');
    nlpManager.addDocument('stock', 'stock mínimo');
    nlpManager.addDocument('stock', 'productos agotados');
    nlpManager.addDocument('stock', 'existencias actuales');
    nlpManager.addDocument('stock', 'stock crítico');
    nlpManager.addDocument('stock', 'productos por acabarse');
    
    // Entrenamiento para órdenes de trabajo
    nlpManager.addDocument('workOrder', 'crear orden de trabajo');
    nlpManager.addDocument('workOrder', 'nueva orden');
    nlpManager.addDocument('workOrder', 'generar orden');
    nlpManager.addDocument('workOrder', 'orden de reparación');
    nlpManager.addDocument('workOrder', 'estado de la orden');
    nlpManager.addDocument('workOrder', 'órdenes pendientes');
    nlpManager.addDocument('workOrder', 'trabajos en proceso');
    nlpManager.addDocument('workOrder', 'reparaciones actuales');
    nlpManager.addDocument('workOrder', 'orden número');
    nlpManager.addDocument('workOrder', 'actualizar orden');
    nlpManager.addDocument('workOrder', 'finalizar orden');
    nlpManager.addDocument('workOrder', 'cancelar orden');
    nlpManager.addDocument('workOrder', 'órdenes completadas');
    nlpManager.addDocument('workOrder', 'historial de órdenes');
    nlpManager.addDocument('workOrder', 'buscar orden');

    // Entidades para productos
    nlpManager.addNamedEntityText('product', 'repuesto', ['es'], [
        'filtro de aceite', 'filtro de aire', 'pastillas de freno',
        'aceite de motor', 'bujías', 'correa de distribución',
        'amortiguadores', 'batería', 'radiador', 'alternador'
    ]);

    // Entidades para estados
    nlpManager.addNamedEntityText('status', 'estado', ['es'], [
        'pendiente', 'en proceso', 'completado', 'cancelado',
        'aprobado', 'rechazado', 'en espera', 'finalizado'
    ]);

    // Respuestas predeterminadas mejoradas
    nlpManager.addAnswer('es', 'quotation', 'Consultando las cotizaciones disponibles...');
    nlpManager.addAnswer('es', 'quotation', 'Buscando información de cotizaciones...');
    nlpManager.addAnswer('es', 'quotation', 'Procesando tu consulta de cotización...');

    nlpManager.addAnswer('es', 'stock', 'Verificando el inventario...');
    nlpManager.addAnswer('es', 'stock', 'Consultando disponibilidad de productos...');
    nlpManager.addAnswer('es', 'stock', 'Buscando información de stock...');

    nlpManager.addAnswer('es', 'workOrder', 'Procesando orden de trabajo...');
    nlpManager.addAnswer('es', 'workOrder', 'Buscando información de la orden...');
    nlpManager.addAnswer('es', 'workOrder', 'Consultando órdenes de trabajo...');

    // Entrenar el modelo con validación cruzada
    console.log('Training model...');
    await nlpManager.train();
    console.log('Training completed');

    // Guardar el modelo entrenado
    
};