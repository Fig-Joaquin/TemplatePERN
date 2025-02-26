import { ChatContext } from './contextManager';
import { handleQuotationIntent } from './intentHandlers/quotationHandler';
import { handleStockIntent } from './intentHandlers/stockHandler';

interface NLPResult {
    intent: string;
    utterance: string;
}

export default async function handleIntent(nlpResult: NLPResult, context: ChatContext): Promise<string> {
        try {
        console.log('NLP Result:', JSON.stringify(nlpResult, null, 2));
            const intent = nlpResult.intent;
            const utterance = nlpResult.utterance;

            // Actualizar el contexto
            context.lastIntent = intent;
            context.conversationHistory.push(utterance);

            // Forzar intención basada en palabras clave
            if (utterance.toLowerCase().includes('cotizacion') || 
                utterance.toLowerCase().includes('cotización')) {
                return await handleQuotationIntent(utterance);
            }

            // Manejar según la intención detectada
            switch (intent) {
                case 'quotation':
                    return await handleQuotationIntent(utterance);
                case 'stock':
                    return await handleStockIntent(utterance);
                case 'workOrder':
                    return "Procesando orden de trabajo..."; // Implementar handleWorkOrderIntent
                default:
                    return "No pude entender tu consulta. ¿Podrías reformularla?";
            }
    } catch (error) {
        console.error('Error in handleIntent:', error);
        return "Lo siento, hubo un error al procesar tu solicitud.";
    }
}
