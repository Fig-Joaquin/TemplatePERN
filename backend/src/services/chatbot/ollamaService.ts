import axios from 'axios';
import { sanitizeResponse } from "../../utils/chatResponseFilter";

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434/api';
export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

export async function generateResponse(prompt: string): Promise<string> {
  try {
    const response = await axios.post(`${OLLAMA_API_URL}/generate`, {
      model: 'qwen2.5:0.5b',
      prompt: prompt,
      stream: false
    });
    
    return response.data.response;
  } catch (error) {
    console.error('Error calling Ollama API:', error);
    throw new Error('Failed to generate response from Ollama');
  }
}

// For more complex interactions where you need context
export async function chatCompletion(messages: Array<{role: string, content: string}>, dbContext?: string): Promise<string> {
  try {
    // Simplified system prompt that doesn't leak into responses
    let systemContent = `Eres un asistente virtual para un taller mecánico que responde preguntas utilizando datos del sistema.`;

    // Add database context in a cleaner format
    if (dbContext) {
      systemContent += ` Usa estos datos reales para tu respuesta: <DATA>${dbContext}</DATA>`;
    }
    
    const systemMessage = {
      role: "system",
      content: systemContent
    };
    
    // Filter out any previous system messages and add our new one at the beginning
    const userMessages = messages.filter(msg => msg.role !== "system");
    const allMessages = [systemMessage, ...userMessages];
    
    console.log("Sending request to Ollama API");

    // Detect query type
    const lastUserMessage = userMessages[userMessages.length - 1]?.content?.toLowerCase() || '';
    const isInventoryQuery = lastUserMessage.includes('stock') || 
                             lastUserMessage.includes('producto') || 
                             lastUserMessage.includes('inventario');
    
    const isQuoteQuery = lastUserMessage.includes('cotizacion') || 
                         lastUserMessage.includes('cotización') || 
                         lastUserMessage.includes('presupuesto');

    const response = await axios.post(`${OLLAMA_API_URL}/chat`, {
      model: 'qwen2.5:0.5b',
      messages: allMessages,
      stream: false,
      temperature: (isInventoryQuery || isQuoteQuery) ? 0.01 : 0.05,
      top_p: (isInventoryQuery || isQuoteQuery) ? 0.7 : 0.9,
      max_tokens: 1024   
    });
    
    let cleanedResponse = sanitizeResponse(response.data.message.content);
    
    // Check for placeholder patterns
    const placeholderPatterns = [
      /\[Nombre\]|\[Marca y modelo reales\]|\[Estado real\]|\[Monto\]|\[Monto real\]/i,
    ];
    
    const containsPlaceholders = placeholderPatterns.some(pattern => pattern.test(cleanedResponse));
    
    // If response contains placeholder data, retry with stronger instructions
    if (containsPlaceholders || cleanedResponse.includes('REGLA #')) {
      console.error('Response contains placeholders or system instructions, retrying');
      
      const retryMessage = {
        role: "system",
        content: `Responde de nuevo, pero esta vez NO repitas ninguna instrucción o regla. 
        Solo proporciona la información solicitada basándote en: ${dbContext}`
      };
      
      const retryResponse = await axios.post(`${OLLAMA_API_URL}/chat`, {
        model: 'qwen2.5:0.5b',
        messages: [...allMessages, retryMessage],
        stream: false,
        temperature: 0.01,
        top_p: 0.5,
        max_tokens: 1024
      });
      
      cleanedResponse = sanitizeResponse(retryResponse.data.message.content);
    }
    
    console.log("Response generated successfully");
    return cleanedResponse;
  } catch (error) {
    console.error('Error calling Ollama chat API:', error);
    throw new Error('Failed to generate chat response from Ollama');
  }
}