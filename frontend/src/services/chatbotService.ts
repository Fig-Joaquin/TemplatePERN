import api from "../utils/axiosConfig"

interface ChatResponse {
  response: string
}

export const sendChatQuery = async (query: string): Promise<ChatResponse> => {
  try {
    const { data } = await api.post<ChatResponse>("/chat", { query })
    return data
  } catch (error) {
    console.error("Error sending chat query:", error)
    throw error
  }
}