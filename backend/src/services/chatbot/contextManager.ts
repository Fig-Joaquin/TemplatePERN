export interface ChatContext {
    lastIntent: string;
    entities: Record<string, unknown>;
    timestamp: number;
    conversationHistory: string[];
    currentTopic?: string;
    activeQuotation?: number;
    activeWorkOrder?: number;
    retrievedData?: Record<string, unknown>;
    followUpContext?: {
        expectingFollowUp: boolean;
        aboutEntity?: string;
        aboutIntent?: string;
        relevantIds?: number[];
    };
}

export class ChatContextManager {
    private static contexts = new Map<string, ChatContext>();
    private static readonly CONTEXT_TIMEOUT = 15 * 60 * 1000; // 15 minutes for longer conversations

    static getContext(sessionId: string): ChatContext {
        this.cleanOldContexts();
        
        if (!this.contexts.has(sessionId)) {
            this.contexts.set(sessionId, this.createNewContext());
        }
        
        return this.contexts.get(sessionId)!;
    }

    static updateContext(sessionId: string, updates: Partial<ChatContext>): void {
        const context = this.getContext(sessionId);
        this.contexts.set(sessionId, {
            ...context,
            ...updates,
            timestamp: Date.now()
        });
    }

    static updateContextWithEntities(sessionId: string, entities: unknown[]): void {
        const context = this.getContext(sessionId);
        // Extraer y almacenar entidades para futuras referencias
        entities.forEach(entity => {
            if (entity && typeof entity === 'object' && 'entity' in entity && 'utteranceText' in entity) {
                context.entities[entity.entity as string] = entity.utteranceText;
            }
        });
        this.updateContext(sessionId, { entities: context.entities });
    }

    static setFollowUpExpectation(
        sessionId: string, 
        aboutEntity?: string, 
        aboutIntent?: string, 
        relevantIds?: number[]
    ): void {
        const context = this.getContext(sessionId);
        context.followUpContext = {
            expectingFollowUp: true,
            aboutEntity,
            aboutIntent,
            relevantIds
        };
        this.updateContext(sessionId, { followUpContext: context.followUpContext });
    }

    static storeRetrievedData(sessionId: string, dataType: string, data: unknown): void {
        const context = this.getContext(sessionId);
        if (!context.retrievedData) {
            context.retrievedData = {};
        }
        context.retrievedData[dataType] = data;
        this.updateContext(sessionId, { retrievedData: context.retrievedData });
    }

    static isFollowUpQuestion(sessionId: string, query: string): boolean {
        const context = this.getContext(sessionId);
        if (!context.followUpContext?.expectingFollowUp) return false;
        
        const followUpIndicators = [
            'cuál', 'cual', 'cuales', 'cuáles', 
            'qué', 'que', 'quién', 'quien', 
            'cómo', 'como', 'cuánto', 'cuanto',
            'y', 'pero', 'también', 'tambien',
            'este', 'esta', 'ese', 'esa'
        ];

        // Check if query starts with follow-up indicators
        const lowercaseQuery = query.toLowerCase().trim();
        return followUpIndicators.some(indicator => 
            lowercaseQuery.startsWith(indicator) || 
            lowercaseQuery.length < 15  // Short queries are likely follow-ups
        );
    }

    private static createNewContext(): ChatContext {
        return {
            lastIntent: 'unknown',
            entities: {},
            timestamp: Date.now(),
            conversationHistory: []
        };
    }

    private static cleanOldContexts(): void {
        const now = Date.now();
        for (const [sessionId, context] of this.contexts.entries()) {
            if (now - context.timestamp > this.CONTEXT_TIMEOUT) {
                this.contexts.delete(sessionId);
            }
        }
    }
    
    static getLastQuery(sessionId: string): string | null {
        const context = this.getContext(sessionId);
        if (context.conversationHistory.length === 0) {
            return null;
        }
        
        try {
            // Look for the last user query in the conversation history
            for (let i = context.conversationHistory.length - 1; i >= 0; i--) {
                const entry = JSON.parse(context.conversationHistory[i]);
                if (entry.query) {
                    return entry.query;
                }
            }
            return null;
        } catch (error) {
            console.error("Error parsing conversation history:", error);
            return null;
        }
    }
}
