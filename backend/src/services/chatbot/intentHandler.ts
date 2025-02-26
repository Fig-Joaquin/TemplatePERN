import { ChatContext, ChatContextManager } from './contextManager';
import { handleQuotationIntent } from './intentHandlers/quotationHandler';
import { handleStockIntent } from './intentHandlers/stockHandler';
import { handleWorkOrderIntent } from './intentHandlers/workorderHandler';
import { nlpManager } from './nlpManager';

interface NLPResult {
    intent: string;
    utterance: string;
    entities: any[];
    score: number;
    [key: string]: unknown;
}

export default async function handleIntent(nlpResult: NLPResult, context: ChatContext, sessionId: string): Promise<string> {
    try {
        console.log('NLP Result:', JSON.stringify(nlpResult, null, 2));
        const intent = nlpResult.intent;
        const utterance = nlpResult.utterance;
        const entities = nlpResult.entities || [];

        // Check for follow-up question
        const isFollowUp = ChatContextManager.isFollowUpQuestion(sessionId, utterance);
        console.log(`Is follow-up question: ${isFollowUp}`);
        
        if (isFollowUp && context.followUpContext?.expectingFollowUp) {
            return await handleFollowUpQuestion(utterance, context, sessionId);
        }

        // Actualizar el contexto
        context.lastIntent = intent;
        
        // Store entities in context
        ChatContextManager.updateContextWithEntities(sessionId, entities);

        // Set current topic based on intent detection
        if (utterance.toLowerCase().includes('cotizacion') || 
            utterance.toLowerCase().includes('cotización')) {
            context.currentTopic = 'quotation';
            return await handleQuotationIntent(utterance, entities);
        }
        
        if (utterance.toLowerCase().includes('orden') || 
            utterance.toLowerCase().includes('trabajo') ||
            utterance.toLowerCase().includes('reparación') ||
            utterance.toLowerCase().includes('reparacion')) {
            context.currentTopic = 'workOrder';
            const response = await handleWorkOrderIntent(utterance);
            
            // Mark context for potential follow-up
            ChatContextManager.setFollowUpExpectation(
                sessionId,
                undefined,
                'workOrder'
            );
            
            return response;
        }
        
        if (utterance.toLowerCase().includes('stock') || 
            utterance.toLowerCase().includes('inventario') ||
            utterance.toLowerCase().includes('producto') ||
            utterance.toLowerCase().includes('disponible')) {
            context.currentTopic = 'stock';
            return await handleStockIntent(utterance);
        }

        // Manejar según la intención detectada
        switch (intent) {
            case 'quotation':
                context.currentTopic = 'quotation';
                const response = await handleQuotationIntent(utterance, entities);
                
                // Mark context for potential follow-up
                ChatContextManager.setFollowUpExpectation(
                    sessionId,
                    undefined,
                    'quotation'
                );
                
                return response;
                
            case 'stock':
                context.currentTopic = 'stock';
                return await handleStockIntent(utterance);
                
            case 'workOrder':
                context.currentTopic = 'workOrder';
                return await handleWorkOrderIntent(utterance);
                
            default:
                // Try to handle based on current topic context if we have one
                if (context.currentTopic === 'quotation') {
                    return await handleQuotationIntent(utterance, entities);
                }
                if (context.currentTopic === 'workOrder') {
                    return await handleWorkOrderIntent(utterance);
                }
                if (context.currentTopic === 'stock') {
                    return await handleStockIntent(utterance);
                }
                
                return "No pude entender tu consulta. ¿Podrías reformularla o especificar si quieres información sobre cotizaciones, órdenes de trabajo o inventario?";
        }
    } catch (error) {
        console.error('Error in handleIntent:', error);
        return "Lo siento, hubo un error al procesar tu solicitud.";
    }
}

async function handleFollowUpQuestion(utterance: string, context: ChatContext, sessionId: string): Promise<string> {
    console.log(`Handling follow-up question: ${utterance}`);
    console.log('Follow-up context:', context.followUpContext);
    
    // Combine with previous question for better context
    const lastQuery = ChatContextManager.getLastQuery(sessionId) || '';
    const enhancedQuery = `${lastQuery} ${utterance}`.trim();
    console.log(`Enhanced query with context: ${enhancedQuery}`);

    // Handle based on the follow-up context
    if (context.followUpContext?.aboutIntent === 'quotation') {
        // For quotation follow-ups
        return await handleQuotationIntent(enhancedQuery, [], true);
    }
    
    if (context.followUpContext?.aboutIntent === 'workOrder') {
        // For work order follow-ups
        return await handleWorkOrderIntent(enhancedQuery);
    }
    
    if (context.currentTopic) {
        // Use current topic if available
        switch (context.currentTopic) {
            case 'quotation':
                return await handleQuotationIntent(enhancedQuery, [], true);
            case 'workOrder':
                return await handleWorkOrderIntent(enhancedQuery);
            case 'stock':
                return await handleStockIntent(enhancedQuery);
        }
    }
    
    // Try to infer intent from the follow-up question
    const result = await nlpManager.process(utterance) as NLPResult;
    if (result.score > 0.4) {
        context.lastIntent = result.intent;
        switch (result.intent) {
            case 'quotation':
                return await handleQuotationIntent(utterance, result.entities);
            case 'stock':
                return await handleStockIntent(utterance);
            case 'workOrder':
                return await handleWorkOrderIntent(utterance);
        }
    }
    
    return "No estoy seguro de a qué te refieres. ¿Puedes formular tu pregunta de forma más completa?";
}
