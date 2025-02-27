import { ChatContext, ChatContextManager } from './contextManager';
import { chatCompletion } from './ollamaService';
import { DatabaseContextProvider } from './databaseContextProvider';

export default async function handleIntent(input: any, context: ChatContext, sessionId: string): Promise<string> {
    try {
        console.log('Received query:', input.utterance);
        
        // Get database context based on query FIRST to prioritize it
        const dbContext = await DatabaseContextProvider.getContextForQuery(input.utterance);
        console.log('Database context provided to model');
        
        // Get conversation history
        const history = ChatContextManager.getConversationHistory(sessionId);
        
        // Format messages for Ollama - limit history to prevent token overload
        const messages = [
            ...history.slice(-3).map(item => {  // Reduced from 5 to 3 for more focused context
                try {
                    const parsed = JSON.parse(item);
                    return {
                        role: parsed.query ? 'user' : 'assistant',
                        content: parsed.query || parsed.response
                    };
                } catch (e) {
                    return { role: 'user', content: item };
                }
            }),
            { role: 'user', content: input.utterance }
        ];
        
        // Call Ollama with context
        const response = await chatCompletion(messages, dbContext);
        
        // Update context
        context.lastIntent = 'chatbot';
        
        return response;
    } catch (error) {
        console.error('Error in handleIntent:', error);
        return "Lo siento, hubo un error al procesar tu solicitud.";
    }
}
