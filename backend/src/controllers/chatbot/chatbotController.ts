import { Request, Response } from "express";
import { nlpManager } from '../../services/chatbot/nlpManager';
import { ChatContextManager } from '../../services/chatbot/contextManager';

// Define NLPResult type locally
interface NLPResult {
  intent: string;
  utterance: string;
  score: number;
  entities: unknown[];
  [key: string]: unknown;
}
import IntentHandler from '../../services/chatbot/intentHandler';

export const handleChatQuery = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query, sessionId = 'default' } = req.body;
        console.log('Received query:', query);
        
        if (!query) {
            res.status(400).json({ message: "Query is required" });
            return;
        }

        const result = await nlpManager.process(query.toLowerCase()) as NLPResult;
        console.log('NLP processing result:', result);

        const context = ChatContextManager.getContext(sessionId);
        // Pasar las entidades detectadas al manejador de intenciones
        const response = await IntentHandler(result, context);

        // Guardar la consulta y respuesta en el contexto para futuras referencias
        context.conversationHistory.push(JSON.stringify({
            query,
            response,
            entities: result.entities,
            timestamp: new Date()
        }));

        console.log('Final response:', response);
        res.json({ 
            response,
            entities: result.entities,
            intent: result.intent,
            score: result.score
        });
    } catch (error) {
        console.error("Error in handleChatQuery:", error);
        res.status(500).json({ 
            message: "Error processing query", 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
};