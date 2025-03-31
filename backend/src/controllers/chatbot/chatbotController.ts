import { Request, Response } from 'express';
import { generateSQL, generateResponse, resetOllamaContext, getConversationalResponse } from '../../services/ollama/ollamaService';
import { generateGeminiResponse, resetGeminiContext, generateGeminiSQL, generateGeminiSQLResponse, getGeminiConversationalResponse } from '../../services/gemini/geminiService';
import { executeQuery, validateSQL } from '../../services/db/dbService';

// Store chat sessions
const chatSessions: Record<string, any[]> = {};

// Define which model to use
const useGemini = true; // Set to true to use Gemini, false to use Ollama

export async function handleChatQuery(req: Request, res: Response): Promise<void> {
  try {
    const { question, sessionId } = req.body;
    
    if (!question) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }
    
    console.log('Received question:', question);
    
    // Store the question in session history if sessionId is provided
    if (sessionId) {
      if (!chatSessions[sessionId]) {
        chatSessions[sessionId] = [];
      }
      chatSessions[sessionId].push({ question, timestamp: new Date() });
    }
    
    if (useGemini) {
      // Use Gemini API for response generation
      try {
        // Check if it's a SQL query or conversational
        try {
          // Generate SQL from the question
          const sqlQuery = await generateGeminiSQL(question);
          
          console.log('Generated SQL with Gemini:', sqlQuery);
          
          // Validate SQL before execution
          const validation = validateSQL(sqlQuery);
          if (!validation.valid) {
            res.status(400).json({ 
              error: validation.error,
              generatedSQL: sqlQuery,
              response: `Lo siento, no pude crear una consulta SQL válida: ${validation.error}`
            });
            return;
          }
          
          try {
            // Execute the query
            const queryResult = await executeQuery(sqlQuery);
            console.log('Query result:', queryResult);
            
            // Generate a natural language response
            const answer = await generateGeminiSQLResponse(question, queryResult);
            
            // Store the response in session history
            if (sessionId && chatSessions[sessionId]) {
              chatSessions[sessionId][chatSessions[sessionId].length - 1].answer = answer;
              chatSessions[sessionId][chatSessions[sessionId].length - 1].sql = sqlQuery;
            }
            
            res.json({
              question,
              sql: sqlQuery,
              result: queryResult,
              answer,
              response: answer
            });
          } catch (dbError: any) {
            // Verificar si es un error de conexión/timeout
            const errorMessage = dbError.message || '';
            const isConnectionError = errorMessage.includes('ETIMEDOUT') || 
                                     errorMessage.includes('ECONNREFUSED') || 
                                     errorMessage.includes('connect');
            
            console.error('Database error:', dbError);
            
            // Manejar específicamente errores de conexión
            if (isConnectionError) {
              res.status(503).json({
                error: 'Error de conexión a la base de datos',
                generatedSQL: sqlQuery,
                response: 'Lo siento, no puedo acceder a la base de datos en este momento. Por favor, inténtalo más tarde.'
              });
            } else {
              // Otros errores de base de datos
              res.status(400).json({
                error: `Error executing SQL query: ${dbError.message}`,
                generatedSQL: sqlQuery,
                response: `Lo siento, ocurrió un error al ejecutar la consulta: ${dbError.message}`
              });
            }
          }
        } catch (error: any) {
          // Check if it's a conversational query
          if (error.message === "CONVERSATIONAL_QUERY") {
            // Respond directly without executing SQL
            const conversationalResponse = await getGeminiConversationalResponse(question);
            res.json({
              question,
              answer: conversationalResponse,
              response: conversationalResponse
            });
            return;
          }
          
          // If not conversational but SQL generation failed
          const answer = await generateGeminiResponse(question, sessionId);
          
          // Store the response in session history
          if (sessionId && chatSessions[sessionId]) {
            chatSessions[sessionId][chatSessions[sessionId].length - 1].answer = answer;
          }
          
          res.json({
            question,
            answer,
            response: answer
          });
        }
      } catch (error) {
        console.error('Error with Gemini:', error);
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          response: "Lo siento, ocurrió un error al procesar tu consulta."
        });
      }
    } else {
      // Use existing Ollama logic
      try {
        // Generate SQL from the question
        const sqlQuery = await generateSQL(question);
        
        console.log('Generated SQL:', sqlQuery);
        
        // Validate SQL before execution
        const validation = validateSQL(sqlQuery);
        if (!validation.valid) {
          res.status(400).json({ 
            error: validation.error,
            generatedSQL: sqlQuery,
            response: `Lo siento, no pude crear una consulta SQL válida: ${validation.error}`
          });
          return;
        }
        
        try {
          // Execute the query
          const queryResult = await executeQuery(sqlQuery);
          console.log('Query result:', queryResult);
          
          // Generate a natural language response
          const answer = await generateResponse(question, queryResult);
          
          // Store the response in session history
          if (sessionId && chatSessions[sessionId]) {
            chatSessions[sessionId][chatSessions[sessionId].length - 1].answer = answer;
            chatSessions[sessionId][chatSessions[sessionId].length - 1].sql = sqlQuery;
          }
          
          res.json({
            question,
            sql: sqlQuery,
            result: queryResult,
            answer,
            response: answer // Add response field to match frontend expectation
          });
        } catch (dbError: any) {
          // Verificar si es un error de conexión/timeout
          const errorMessage = dbError.message || '';
          const isConnectionError = errorMessage.includes('ETIMEDOUT') || 
                                   errorMessage.includes('ECONNREFUSED') || 
                                   errorMessage.includes('connect');
          
          console.error('Database error:', dbError);
          
          // Manejar específicamente errores de conexión
          if (isConnectionError) {
            res.status(503).json({
              error: 'Error de conexión a la base de datos',
              generatedSQL: sqlQuery,
              response: 'Lo siento, no puedo acceder a la base de datos en este momento. Por favor, inténtalo más tarde.'
            });
          } else {
            // Otros errores de base de datos
            res.status(400).json({
              error: `Error executing SQL query: ${dbError.message}`,
              generatedSQL: sqlQuery,
              response: `Lo siento, ocurrió un error al ejecutar la consulta: ${dbError.message}`
            });
          }
        }
      } catch (error: any) {
        // Check if it's a conversational query
        if (error.message === "CONVERSATIONAL_QUERY") {
          // Respond directly without executing SQL
          const conversationalResponse = await getConversationalResponse(question);
          res.json({
            question,
            answer: conversationalResponse,
            response: conversationalResponse
          });
          return;
        }
        
        console.error('Error generating SQL:', error);
        res.status(400).json({
          error: error.message,
          response: "Lo siento, no pude entender tu consulta."
        });
      }
    }
  } catch (error: any) {
    console.error('Error in chatbot controller:', error);
    res.status(500).json({ 
      error: error.message,
      response: "Lo siento, ocurrió un error al procesar tu consulta."
    });
  }
}

export async function handleChatFeedback(req: Request, res: Response) {
  try {
    const { sessionId, feedback } = req.body;
    
    if (!sessionId || !feedback) {
      return res.status(400).json({ error: 'SessionId and feedback are required' });
    }
    
    // Store feedback (could be expanded to use for fine-tuning)
    if (!chatSessions[sessionId]) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Add feedback to the specific message or session
    // This is a simple implementation - could be enhanced
    
    return res.status(200).json({ message: 'Feedback received' });
  } catch (error) {
    console.error('Error handling chat feedback:', error);
    return res.status(500).json({ error: 'Failed to process feedback' });
  }
}

export async function resetChatSession(req: Request, res: Response) {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'SessionId is required' });
    }
    
    // Reset the session history
    if (chatSessions[sessionId]) {
      delete chatSessions[sessionId];
    }
    
    // Reset the model context for this session
    const resetResult = useGemini 
      ? await resetGeminiContext(sessionId)
      : await resetOllamaContext(sessionId);
    
    return res.status(200).json({ 
      message: 'Session reset successfully', 
      resetStatus: resetResult 
    });
  } catch (error) {
    console.error('Error resetting chat session:', error);
    return res.status(500).json({ error: 'Failed to reset session' });
  }
}
