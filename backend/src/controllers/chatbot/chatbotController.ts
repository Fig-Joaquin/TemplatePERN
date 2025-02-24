// backend/src/controllers/chatbotController.ts

import { Request, Response } from "express";
import natural from "natural";
import { handleStockIntent } from '../../services/chatbot/intentHandlers/stockHandler';
import { handleQuotationIntent } from '../../services/chatbot/intentHandlers/quotationHandler';
import { handleWorkOrderIntent } from '../../services/chatbot/intentHandlers/workorderHandler';
import { detectIntent } from '../../services/chatbot/intentDetector';

// Tokenizer para español
const tokenizer = new natural.AggressiveTokenizerEs();

interface ChatContext {
  lastIntent: string;
  lastEntity?: string;
  timestamp: number;
}

const chatContexts = new Map<string, ChatContext>();

// controllers/chatbot/chatbotController.ts
export const handleChatQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, sessionId } = req.body; // Añadir sessionId en las peticiones
    const tokens = tokenizer.tokenize(query.toLowerCase());
    
    // Obtener o crear contexto
    const context = chatContexts.get(sessionId) || {
      lastIntent: 'unknown',
      timestamp: Date.now()
    };
    
    // Verificar si el contexto es reciente (menos de 5 minutos)
    const isRecentContext = (Date.now() - context.timestamp) < 5 * 60 * 1000;
    
    let intent = detectIntent(tokens);
    
    // Si no se detecta intención y hay contexto reciente, usar la última intención
    if (intent === 'unknown' && isRecentContext) {
      intent = context.lastIntent;
    }

    let response = "Lo siento, no pude entender tu consulta. Por favor, reformula la pregunta.";

    switch (intent) {
      case 'stock':
        const stockResponse = await handleStockIntent(query);
        if (stockResponse) response = stockResponse;
        break;
      case 'quotation':
        const quotationResponse = await handleQuotationIntent(query);
        if (quotationResponse) response = quotationResponse;
        break;
      case 'workOrder':
        const workOrderResponse = await handleWorkOrderIntent(query);
        if (workOrderResponse) response = workOrderResponse;
        break;
    }

    // Actualizar contexto
    chatContexts.set(sessionId, {
      lastIntent: intent,
      timestamp: Date.now()
    });

    res.json({ response });
  } catch (error) {
    res.status(500).json({ message: "Error procesando la consulta", error });
  }
};