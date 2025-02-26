import api from "../utils/axiosConfig"

const API_URL = '/chatbot';

export const sendChatQuery = async (query: string) => {
  const response = await api.post(`${API_URL}/query`, { 
    query,
    sessionId: getSessionId() 
  });
  return response.data;
};

export const sendChatFeedback = async (query: string, response: string, wasCorrect: boolean) => {
  const feedback = await api.post(`${API_URL}/feedback`, {
    query,
    response,
    wasCorrect,
    sessionId: getSessionId()
  });
  return feedback.data;
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