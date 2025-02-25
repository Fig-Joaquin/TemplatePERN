import { nlpManager } from '../services/chatbot/nlpManager';

interface TrainingData {
    intent: string;
    patterns: string[];
    responses: string[];
    entities?: {
        [key: string]: string[];
    };
}

const trainingData: TrainingData[] = [
    {
        intent: 'quotation',
        patterns: [
            // Patrones básicos
            'necesito una cotización',
            'quiero una cotización',
            'busco una cotización',
            'dame una cotización',
            'hazme una cotización',
            
            // Patrones con productos/servicios
            'cotizar un producto',
            'cotizar un servicio',
            'cuánto cuesta',
            'cuánto vale',
            'cuánto sale',
            
            // Patrones de listado
            'mostrar cotizaciones',
            'ver cotizaciones',
            'lista de cotizaciones',
            'estado de la cotización',
            
            // Patrones con números
            'cotización número',
            'cotización del cliente',
            'cotizaciones pendientes',
            'cotizaciones aprobadas',
            'cotizaciones rechazadas',
            
            // Patrones temporales
            'cotizaciones de hoy',
            'cotizaciones de esta semana',
            'cotizaciones de este mes',
            'última cotización',
            'cotización más reciente',
            
            // Patrones de monto
            'cotización más cara',
            'cotización más costosa',
            'cotización más económica',
            'cotización más barata',
            'mayor precio',
            'menor precio'
        ],
        responses: [
            'Consultando la información de cotizaciones...',
            'Buscando las cotizaciones solicitadas...',
            'Procesando tu consulta sobre cotizaciones...'
        ],
        entities: {
            status: ['pendiente', 'aprobada', 'rechazada', 'en proceso'],
            timeframe: ['hoy', 'esta semana', 'este mes', 'última', 'reciente'],
            amount: ['cara', 'costosa', 'económica', 'barata', 'mayor', 'menor']
        }
    },
    {
        intent: 'stock',
        patterns: [
            'revisar stock',
            'verificar inventario',
            'productos disponibles',
            'stock actual',
            'hay stock de',
            'queda producto',
            'disponibilidad de',
            'inventario actual',
            'productos en bodega',
            'cantidad disponible'
        ],
        responses: [
            'Verificando el inventario...',
            'Consultando disponibilidad de productos...',
            'Buscando información de stock...'
        ],
        entities: {
            product: ['filtro', 'aceite', 'batería', 'frenos', 'neumáticos'],
            quantity: ['bajo', 'alto', 'crítico', 'suficiente', 'agotado']
        }
    }
];

export const setupTraining = async () => {
    console.log('Starting enhanced NLP training...');

    // Limpiar entrenamiento previo
    await nlpManager.clear();

    for (const data of trainingData) {
        // Entrenar patrones base
        data.patterns.forEach(pattern => {
                    nlpManager.addDocument(data.intent, pattern);
                });

        // Entrenar con variaciones
        data.patterns.forEach(pattern => {
                    const variations = generatePatternVariations(pattern);
                    variations.forEach(variation => {
                        nlpManager.addDocument(data.intent, variation);
                    });
                });

        // Agregar respuestas
        data.responses.forEach(response => {
            nlpManager.addAnswer('es', data.intent, response);
        });

        // Agregar entidades
        if (data.entities) {
            for (const [entity, values] of Object.entries(data.entities)) {
                nlpManager.addNamedEntityText(entity, entity, ['es'], values);
            }
        }
    }

    // Agregar entidades comunes
    nlpManager.addCustomEntities();

    // Entrenar el modelo
    console.log('Training model...');
    await nlpManager.train();
    console.log('Training completed');
};

function generatePatternVariations(pattern: string): string[] {
    const variations: Set<string> = new Set();
    
    // Diccionario de sinónimos mejorado
    const synonyms: { [key: string]: string[] } = {
        'cotización': ['cotizacion', 'presupuesto', 'precio', 'valor', 'costo'],
        'mostrar': ['ver', 'listar', 'buscar', 'encontrar', 'consultar'],
        'estado': ['situación', 'estatus', 'condición'],
        'productos': ['artículos', 'items', 'elementos', 'materiales'],
        'stock': ['inventario', 'existencias', 'disponibilidad'],
        'hay': ['existe', 'tienen', 'cuentan', 'disponen'],
        'cuánto': ['cual es el precio', 'que precio tiene', 'que vale']
    };

    // Agregar la variación original
    variations.add(pattern);

    // Generar variaciones con sinónimos
    Object.entries(synonyms).forEach(([word, syns]) => {
        if (pattern.toLowerCase().includes(word.toLowerCase())) {
            syns.forEach(syn => {
                variations.add(
                    pattern.toLowerCase().replace(
                        new RegExp(word, 'gi'), 
                        syn
                    )
                );
            });
        }
    });

    return Array.from(variations);
}