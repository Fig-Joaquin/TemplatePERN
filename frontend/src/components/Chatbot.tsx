import { useState } from "react"
import { SendHorizontal, X, Trash2, MessageCircle, ThumbsUp, ThumbsDown } from "lucide-react"
import { toast } from "react-toastify"
import { sendChatQuery, sendChatFeedback } from "../services/chatbotService"

interface Message {
  text: string
  isUser: boolean
  id?: string
  hasFeedback?: boolean
}

export const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = { text: input, isUser: true }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const { response } = await sendChatQuery(input)
      const botMessage: Message = { 
        text: response, 
        isUser: false,
        id: Date.now().toString(), // Unique ID for the message
        hasFeedback: false
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      toast.error("Error al procesar tu consulta")
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async (messageId: string, isPositive: boolean) => {
    // Find the message and its corresponding user query
    const messageIndex = messages.findIndex(m => !m.isUser && m.id === messageId);
    if (messageIndex <= 0) return;
    
    const botMessage = messages[messageIndex];
    const userQuery = messages[messageIndex - 1].text;
    
    try {
      await sendChatFeedback(userQuery, botMessage.text, isPositive);
      
      // Update message to show feedback was given
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId ? { ...msg, hasFeedback: true } : msg
        )
      );
      
      toast.success(isPositive ? "¡Gracias por tu feedback positivo!" : "Gracias por ayudarnos a mejorar");
    } catch (error) {
      toast.error("Error al enviar feedback");
    }
  }

  const clearHistory = () => {
    setMessages([])
    toast.success("Historial borrado")
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-4 bg-primary hover:bg-primary hover:bg-opacity-90 text-primary-foreground rounded-full shadow-lg"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 flex flex-col h-[600px] w-full max-w-[400px] bg-card rounded-lg shadow-lg border border-border">
      <div className="flex justify-between items-center p-4 border-b border-border bg-muted">
        <h2 className="text-lg font-semibold text-foreground">Asistente Virtual</h2>
        <div className="flex gap-2">
          <button
            onClick={clearHistory}
            className="p-2 hover:bg-accent rounded-full text-muted-foreground hover:text-accent-foreground"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-destructive rounded-full text-muted-foreground hover:text-destructive-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-background">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.isUser
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {message.text}
              
              {!message.isUser && !message.hasFeedback && (
                <div className="flex justify-end mt-2 gap-2">
                  <button 
                    onClick={() => handleFeedback(message.id!, true)}
                    className="p-1 hover:bg-green-100 rounded-full"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleFeedback(message.id!, false)}
                    className="p-1 hover:bg-red-100 rounded-full"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-none p-4 border-t border-border bg-card">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta sobre algo..."
            disabled={loading}
            className="flex-1 p-2 bg-input text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary hover:bg-opacity-90 disabled:opacity-50"
          >
            <SendHorizontal className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}