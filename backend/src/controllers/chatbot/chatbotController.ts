import { Request, Response } from "express";
import { ChatContextManager } from '../../services/chatbot/contextManager';
import handleIntent from '../../services/chatbot/intentHandler';
import { AppDataSource } from "../../config/ormconfig";
import { Quotation } from "../../entities";

export const handleChatQuery = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query, sessionId = 'default' } = req.body;
        console.log('Received query:', query);
        
        if (!query) {
            res.status(400).json({ message: "Query is required" });
            return;
        }

        const context = ChatContextManager.getContext(sessionId);
        
        // Create a simple input object for Ollama
        const input = { utterance: query };
        
        // Special case for common queries that need direct database access
        const lowerQuery = query.toLowerCase();
        if (lowerQuery.includes("pendiente") && (lowerQuery.includes("cotizacion") || lowerQuery.includes("cotización"))) {
            const pendingQuotations = await AppDataSource.getRepository(Quotation).find({
                where: { quotation_Status: 'pending' },
                relations: ["vehicle", "vehicle.owner", "vehicle.company"]
            });
            
            if (pendingQuotations.length === 0) {
                res.json({
                    response: "No hay cotizaciones pendientes en el sistema actualmente.",
                    intent: 'database_direct',
                    score: 1.0
                });
                return;
            }
            
            let response = `Hay ${pendingQuotations.length} cotización(es) pendiente(s):\n\n`;
            pendingQuotations.forEach(quotation => {
                const clientName = quotation.vehicle?.owner?.name || quotation.vehicle?.company?.name || "No especificado";
                response += `- Cotización #${quotation.quotation_id}: Cliente ${clientName}\n`;
            });
            
            // Save conversation history
            context.conversationHistory.push(JSON.stringify({
                query,
                response,
                timestamp: new Date()
            }));
            
            res.json({
                response,
                intent: 'database_direct',
                score: 1.0
            });
            return;
        }
        
        // Process with Ollama for other queries
        const response = await handleIntent(input, context, sessionId);

        // Save conversation history
        context.conversationHistory.push(JSON.stringify({
            query,
            response,
            timestamp: new Date()
        }));

        console.log('Final response:', response);
        res.json({ 
            response,
            intent: 'chatbot',
            score: 1.0
        });
    } catch (error) {
        console.error("Error in handleChatQuery:", error);
        res.status(500).json({ 
            message: "Error processing query", 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
};

export const handleChatFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query, wasCorrect, sessionId = 'default' } = req.body;
        
        if (!query || wasCorrect === undefined) {
            res.status(400).json({ message: "Query and feedback status are required" });
            return;
        }

        console.log(`Received feedback for query: "${query}" - Was correct: ${wasCorrect}`);
        
        // Update context with feedback information
        const context = ChatContextManager.getContext(sessionId);
        if (context.conversationHistory.length > 0) {
            // Find the relevant conversation entry and update it with feedback
            const updatedHistory = context.conversationHistory.map(entry => {
                try {
                    const parsed = JSON.parse(entry);
                    if (parsed.query === query) {
                        return JSON.stringify({
                            ...parsed,
                            feedback: wasCorrect ? 'positive' : 'negative',
                            feedbackTimestamp: new Date()
                        });
                    }
                    return entry;
                } catch (e) {
                    return entry;
                }
            });
            
            ChatContextManager.updateContext(sessionId, { 
                conversationHistory: updatedHistory 
            });
        }
        
        res.json({ success: true, message: "Feedback recorded" });
    } catch (error) {
        console.error("Error in handleChatFeedback:", error);
        res.status(500).json({ 
            message: "Error processing feedback", 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
};

export const resetChatSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.body;
      
      // Force a new context for this session ID by deleting the old one
      ChatContextManager.deleteContext(sessionId);
      
      res.json({ success: true, message: "Chat session reset successfully" });
    } catch (error) {
      console.error("Error in resetChatSession:", error);
      res.status(500).json({ 
        message: "Error resetting chat session", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
};