import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from '../../config/config';
import { dbSchema } from '../../config/dbSchema';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

// Get the generative model
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

// Default generation configuration
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192, // Setting a reasonable limit for chat responses
};

// Store chat sessions
const chatSessions: Record<string, any> = {};

// Define error messages for better user experience
const errorMessages = {
  FORBIDDEN_OPERATION: "Por seguridad, solo se permiten consultas SELECT para proteger la integridad de la base de datos. Intenta reformular tu pregunta como una consulta de lectura.",
  CONNECTION_ERROR: "No puedo conectarme al servicio en este momento. Por favor, intenta nuevamente en unos instantes.",
  QUOTA_EXCEEDED: "Se ha alcanzado el límite de consultas permitidas. Por favor, intenta más tarde.",
  INVALID_QUERY: "No pude entender tu consulta. Por favor, intenta expresarla de manera diferente o con más detalles.",
  DEFAULT: "Lo siento, ocurrió un error al procesar tu consulta. Por favor, intenta expresarla de otra manera."
};

/**
 * Clean SQL query from generated response
 */
function cleanSql(sql: string): string {
  // Normalize SQL for checking
  const normalizedSql = sql.toLowerCase().trim();
  
  // Check for dangerous operations
  const forbiddenOperations = ['delete', 'insert', 'update', 'drop', 'truncate', 'alter'];
  if (forbiddenOperations.some(op => normalizedSql.includes(op))) {
    throw new Error("FORBIDDEN_OPERATION");
  }

  return sql
    .replace(/^[^]*?(SELECT)/i, '$1')
    .replace(/```sql|```|La consulta SQL válida.*?\n/g, '')
    .replace(/;[^]*$/, ';')
    .trim();
}

/**
 * Generate SQL query using Gemini API
 */
export async function generateGeminiSQL(question: string): Promise<{ isError: boolean; message: string; isConversational?: boolean }> {
  // Check for conversational queries
  if (/^(hola|saludos|buenos días|buenas tardes|buenas noches|qué tal|como estás|gracias|ayuda|help)/i.test(question.trim())) {
    return { isError: false, isConversational: true, message: await getGeminiConversationalResponse(question) };
  }
  
  // Format the schema information
  const tables = Object.entries(dbSchema).map(([tableName, schema]) => {
    const columns = Object.keys(schema.columns).join(', ');
    return `${tableName}: ${columns}`;
  }).join('\n');
  
  console.log('Available tables for Gemini:', tables);
  
  // Modified prompt to encourage joins when querying vehicles
  const prompt = `Tablas PostgreSQL:\n${tables}\n\n
Instrucciones importantes:
- Utiliza siempre LEFT JOIN en lugar de INNER JOIN cuando sea posible para preservar todos los registros de la tabla principal
- Cuando generes consultas que involucren la tabla vehicles:
  - Usa LEFT JOIN con vehicle_models y vehicle_brands para obtener información del modelo y marca
  - Usa LEFT JOIN con persons para obtener información del propietario si es una persona
  - Usa LEFT JOIN con companies para obtener información de la empresa si es una compañía
  - Usa LEFT JOIN con mileage_history para obtener el historial de kilometraje
- Cuando una tabla tenga relación con otra tabla que contiene información descriptiva, siempre incluye un LEFT JOIN

Genera una consulta SQL para: ${question}\n\n
Devuelve solo la consulta SQL sin comentarios adicionales. No uses comillas para encerrar la consulta.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    console.log('Raw Gemini SQL response:', response);
    
    try {
      const sql = cleanSql(response);
      console.log('Cleaned Gemini SQL:', sql);
      return { isError: false, message: sql };
    } catch (error) {
      if (error instanceof Error && error.message === "FORBIDDEN_OPERATION") {
        return { 
          isError: true, 
          message: errorMessages.FORBIDDEN_OPERATION 
        };
      }
      throw error;
    }
  } catch (error) {
    console.error('Error generating SQL with Gemini:', error);
    let errorMessage = errorMessages.DEFAULT;

    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes("quota") || errorMsg.includes("rate limit")) {
        errorMessage = errorMessages.QUOTA_EXCEEDED;
      } else if (errorMsg.includes("connect") || errorMsg.includes("network") || errorMsg.includes("timeout")) {
        errorMessage = errorMessages.CONNECTION_ERROR;
      } else if (errorMsg.includes("invalid") || errorMsg.includes("parse")) {
        errorMessage = errorMessages.INVALID_QUERY;
      }
    }

    return { 
      isError: true, 
      message: errorMessage 
    };
  }
}

/**
 * Generate response using Gemini API
 */
export async function generateGeminiResponse(question: string, sessionId?: string): Promise<string> {
  try {
    // Create or retrieve chat session
    if (!sessionId || !chatSessions[sessionId]) {
      // Initialize a new chat session
      const chatSession = model.startChat({
        generationConfig,
        history: [],
      });
      
      if (sessionId) {
        chatSessions[sessionId] = chatSession;
      }
      
      const result = await chatSession.sendMessage(question);
      return result.response.text();
    } else {
      // Use existing chat session
      const chatSession = chatSessions[sessionId];
      const result = await chatSession.sendMessage(question);
      return result.response.text();
    }
  } catch (error) {
    console.error('Error generating response with Gemini:', error);
    
    let errorMessage = "Lo siento, no pude procesar tu consulta en este momento. Por favor, intenta de nuevo con otra pregunta.";
    
    // Provide more specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes("quota")) {
        errorMessage = errorMessages.QUOTA_EXCEEDED;
      } else if (error.message.includes("connect")) {
        errorMessage = errorMessages.CONNECTION_ERROR;
      } else if (error.message.includes("invalid")) {
        errorMessage = errorMessages.INVALID_QUERY;
      }
    }
    
    return errorMessage;
  }
}

/**
 * Generate response based on SQL results using Gemini
 */
export async function generateGeminiSQLResponse(question: string, sqlResult: any[]): Promise<string> {
  if (!sqlResult || sqlResult.length === 0) {
    return "No se encontraron resultados para tu consulta. Intenta reformular tu pregunta o usar otros términos de búsqueda.";
  }

  try {
    const prompt = `Pregunta: "${question}"
Resultados: ${JSON.stringify(sqlResult)}

Instrucciones importantes para formatear la respuesta:
1. Formatea TODOS los valores de precio o montos en formato de pesos chilenos (CLP) con separador de miles y símbolo $ (ej: $5.990.000)
2. Formatea las fechas de manera legible, preferentemente en formato DD/MM/YYYY o "10 de abril de 2025", evitando mostrar timestamps completos
3. Cuando encuentres valores NULL, undefined o vacíos, muestra mensajes como "Desconocido", "No especificado", "No hay información disponible" o similar
4. Genera una respuesta completa, clara y concisa en español basada en los resultados SQL
5. Si hay muchos resultados, resúmelos de manera efectiva mencionando la cantidad total y destacando los más relevantes

Genera una respuesta profesional basada en estos criterios.`;
    
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generando respuesta con Gemini:', error);
    
    let errorMessage = "No se pudo generar una respuesta a partir de los resultados. Por favor, intenta con otra consulta.";
    
    // Provide more specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes("quota")) {
        errorMessage = errorMessages.QUOTA_EXCEEDED;
      } else if (error.message.includes("connect")) {
        errorMessage = errorMessages.CONNECTION_ERROR;
      }
    }
    
    return errorMessage;
  }
}

/**
 * Get conversational response (when no SQL is needed)
 */
export async function getGeminiConversationalResponse(question: string): Promise<string> {
  try {
    const prompt = `Eres un asistente para un taller mecánico llamado "Mecánica automotriz A&M" que responde consultas hechas por los adiminstradores de dicho taller. Pregunta: "${question}"`;
    
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generando respuesta conversacional con Gemini:', error);
    
    let errorMessage = "Lo siento, no pude procesar tu consulta conversacional en este momento.";
    
    // Provide more specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes("quota")) {
        errorMessage = errorMessages.QUOTA_EXCEEDED;
      } else if (error.message.includes("connect")) {
        errorMessage = errorMessages.CONNECTION_ERROR;
      }
    }
    
    return errorMessage;
  }
}

/**
 * Reset a chat session
 */
export async function resetGeminiContext(sessionId: string): Promise<boolean> {
  try {
    if (chatSessions[sessionId]) {
      delete chatSessions[sessionId];
    }
    return true;
  } catch (error) {
    console.error('Error resetting Gemini context:', error);
    return false;
  }
}