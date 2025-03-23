import api from "../utils/axiosConfig"

const API_URL = '/chatbot';

export const sendChatQuery = async (question: string) => {
  const response = await api.post(`${API_URL}/query`, { 
    question,
    sessionId: getSessionId() 
  });
  
  // Handle the response format from backend (returns answer, not response)
  if (response.data && response.data.answer) {
    return { response: response.data.answer };
  } else {
    // If the expected structure is not found, return the raw response data
    // or create a formatted error message
    return { response: response.data.answer || "No se pudo procesar la respuesta" };
  }
};

export const sendChatFeedback = async (question: string, response: string, wasCorrect: boolean) => {
  const feedback = await api.post(`${API_URL}/feedback`, {
    question,
    response,
    wasCorrect,
    sessionId: getSessionId()
  });
  return feedback.data;
};

export const resetChatSession = async (): Promise<void> => {
  // Generate a new session ID
  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Tell the backend to reset the previous session (if any)
  const oldSessionId = localStorage.getItem('chatbot_session_id');
  if (oldSessionId) {
    try {
      const resetResponse = await api.post(`${API_URL}/reset`, { sessionId: oldSessionId });
      if (resetResponse.data.ollamaReset === false) {
        console.warn('Ollama context reset was not successful, but session was cleared locally');
      } else {
        console.log('Session reset successfully, including Ollama context');
      }
    } catch (error) {
      console.error('Failed to reset chat session:', error);
    }
  }
  
  // Update to the new session ID
  localStorage.setItem('chatbot_session_id', newSessionId);
};

// Helper to get or create a session ID
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('chatbot_session_id');
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('chatbot_session_id', sessionId);
  }
  
  return sessionId;
};