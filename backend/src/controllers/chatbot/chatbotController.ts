import { Request, Response } from 'express';
import { generateSQL, generateResponse, resetOllamaContext, getConversationalResponse } from '../../services/ollama/ollamaService';
import { resetGeminiContext, generateGeminiSQL, generateGeminiSQLResponse } from '../../services/gemini/geminiService';
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
      try {
        const result = await generateGeminiSQL(question);
        
        // If it's a conversational query, return the response directly
        if (result.isConversational) {
          res.json({
            question,
            answer: result.message,
            response: result.message
          });
          return;
        }

        // Continue with SQL processing if not conversational
        if (result.isError) {
          res.status(400).json({ 
            error: result.message,
            response: result.message 
          });
          return;
        }
        
        const sqlQuery = result.message;
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
          const errorMessage = dbError.message || '';
          const isConnectionError = errorMessage.includes('ETIMEDOUT') || 
                                   errorMessage.includes('ECONNREFUSED') || 
                                   errorMessage.includes('connect');
          
          console.error('Database error:', dbError);
          
          if (isConnectionError) {
            res.status(503).json({
              error: 'Error de conexión a la base de datos',
              generatedSQL: sqlQuery,
              response: 'Lo siento, no puedo acceder a la base de datos en este momento. Por favor, inténtalo más tarde.'
            });
          } else {
            res.status(400).json({
              error: `Error executing SQL query: ${dbError.message}`,
              generatedSQL: sqlQuery,
              response: `Lo siento, ocurrió un error al ejecutar la consulta: ${dbError.message}`
            });
          }
        }
      } catch (error) {
        console.error('Error with Gemini:', error);
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          response: "Lo siento, ocurrió un error al procesar tu consulta."
        });
      }
    } else {
      try {
        const sqlQuery = await generateSQL(question);
        
        console.log('Generated SQL:', sqlQuery);
        
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
          const queryResult = await executeQuery(sqlQuery);
          console.log('Query result:', queryResult);
          
          const answer = await generateResponse(question, queryResult);
          
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
          const errorMessage = dbError.message || '';
          const isConnectionError = errorMessage.includes('ETIMEDOUT') || 
                                   errorMessage.includes('ECONNREFUSED') || 
                                   errorMessage.includes('connect');
          
          console.error('Database error:', dbError);
          
          if (isConnectionError) {
            res.status(503).json({
              error: 'Error de conexión a la base de datos',
              generatedSQL: sqlQuery,
              response: 'Lo siento, no puedo acceder a la base de datos en este momento. Por favor, inténtalo más tarde.'
            });
          } else {
            res.status(400).json({
              error: `Error executing SQL query: ${dbError.message}`,
              generatedSQL: sqlQuery,
              response: `Lo siento, ocurrió un error al ejecutar la consulta: ${dbError.message}`
            });
          }
        }
      } catch (error: any) {
        if (error.message === "CONVERSATIONAL_QUERY") {
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
    
    if (!chatSessions[sessionId]) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
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
    
    if (chatSessions[sessionId]) {
      delete chatSessions[sessionId];
    }
    
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
