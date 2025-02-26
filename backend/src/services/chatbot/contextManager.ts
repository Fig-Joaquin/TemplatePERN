export interface ChatContext {
    lastIntent: string;
    entities: Record<string, unknown>;
    timestamp: number;
    conversationHistory: string[];
}

export class ChatContextManager {
    private static contexts = new Map<string, ChatContext>();
    private static readonly CONTEXT_TIMEOUT = 5 * 60 * 1000; // 5 minutos

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
}
