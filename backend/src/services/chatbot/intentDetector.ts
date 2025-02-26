 
import { NlpManager } from 'node-nlp';

const manager = new NlpManager({ languages: ['es'] });

// Entrenar el modelo con las palabras clave
const intentKeywords = {
    stock: [
        'stock', 'cantidad', 'quedan', 'hay', 'disponible', 'inventario', 'existencia',
        'almacen', 'bodega', 'productos', 'unidades', 'disponibilidad', 'queda',
        'stockear', 'almacenar', 'guardar'
    ],
    quotation: [
        'cotizacion', 'cotizar', 'precio', 'presupuesto', 'valor', 'listar', 
        'mostrar', 'todas', 'pendientes', 'estado', 'mayor', 'mas', 'cara', 
        'reciente', 'ultima', 'cotizaciones', 'costo', 'vale', 'cuanto', 'cuánto',
        'presupuestar', 'cotizame', 'cotízame', 'cuestan', 'valen'
    ],
    workOrder: [
        'orden', 'trabajo', 'reparacion', 'servicio', 'mantenimiento',
        'arreglo', 'revision', 'revisión', 'reparar', 'mantener', 'revisar',
        'diagnostico', 'diagnóstico', 'taller', 'mecanico', 'mecánico'
    ]
};

// Entrenar el modelo
Object.entries(intentKeywords).forEach(([intent, keywords]) => {
    keywords.forEach(keyword => {
        manager.addDocument('es', keyword, intent);
    });
});

(async () => {
    await manager.train();
})();

export const detectIntent = async (tokens: string[]) => {
    const text = tokens.join(' ');
    const result = await manager.process('es', text);
    
    // Reducir el umbral de confianza
    if (result.intent && result.score > 0.3) {
        return result.intent;
    }
    
    return 'unknown';
};