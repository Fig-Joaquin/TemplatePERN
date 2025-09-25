import { useEffect, useState } from "react"
import { SendHorizontal, X, Trash2, MessageCircle, ThumbsUp, ThumbsDown, Bot } from "lucide-react"
import { toast } from "react-toastify"
import { sendChatQuery, sendChatFeedback, resetChatSession } from "../services/chatbotService"
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"

interface Message {
  text: string
  isUser: boolean
  id?: string
  hasFeedback?: boolean
}

export const Chatbot = () => {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [, setIsTyping] = useState(false)
  const [isWaitingResponse, setIsWaitingResponse] = useState(false)

  // Rehidratar estado desde localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chatbot_messages')
      if (saved) {
        setMessages(JSON.parse(saved))
      }
      const savedOpen = localStorage.getItem('chatbot_is_open')
      if (savedOpen !== null) {
        setIsOpen(savedOpen === 'true')
      }
    } catch {}
  }, [])

  // Persistir mensajes y estado abierto/cerrado
  useEffect(() => {
    try { localStorage.setItem('chatbot_messages', JSON.stringify(messages)) } catch {}
  }, [messages])
  useEffect(() => {
    try { localStorage.setItem('chatbot_is_open', String(isOpen)) } catch {}
  }, [isOpen])

  // Función para crear efecto de tipeo
  const typeBotMessage = (messageId: string, fullText: string) => {
    let displayText = "";
    let charIndex = 0;
    
    // Velocidad de tipeo (menor número = más rápido)
    const typingSpeed = 15;
    
    const typeChar = () => {
      if (charIndex < fullText.length) {
        displayText += fullText[charIndex];
        charIndex++;
        
        // Actualizar el mensaje con el texto actual
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === messageId ? { ...msg, text: displayText } : msg
          )
        );
        
        // Programar el siguiente caracter
        setTimeout(typeChar, typingSpeed);
      } else {
        // Tipeo completado
        setIsTyping(false);
      }
    };
    
    // Iniciar tipeo
    typeChar();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = { text: input, isUser: true }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)
    
    const placeholderId = Date.now().toString();
    // Añadimos el mensaje del bot con los puntos de espera
    setMessages((prev) => [
      ...prev, 
      { 
        text: "", 
        isUser: false, 
        id: placeholderId, 
        hasFeedback: false 
      }
    ])

    try {
      setIsWaitingResponse(true) // Mostrar los puntos de espera
      const response = await sendChatQuery(input)
      setIsWaitingResponse(false) // Ocultar los puntos de espera
      
      // Si hay un mensaje de respuesta, mostrarlo
      if (response && response.response) {
        setIsTyping(true) // Iniciar animación de tipeo
        typeBotMessage(placeholderId, response.response);
      } else {
        // Si no hay respuesta, mostrar un mensaje de error genérico
        setMessages(prev => 
          prev.map(m => m.id === placeholderId 
            ? { ...m, text: "Lo siento, no pude procesar tu consulta correctamente." } 
            : m
          )
        );
      }
    } catch (error: any) {
      setIsWaitingResponse(false)
      setIsTyping(false)
      
      // Extraer el mensaje de error del objeto de respuesta
      let errorMessage = "Error al procesar tu consulta. Por favor, intenta con otra pregunta.";
      
      if (error.response && error.response.data) {
        // Si hay una propiedad 'response' en el error.response.data, usarla
        if (error.response.data.response) {
          errorMessage = error.response.data.response;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      // Mostrar el mensaje de error directamente en el chat como si fuera un mensaje del bot
      setMessages(prev => 
        prev.map(m => m.id === placeholderId 
          ? { ...m, text: errorMessage } 
          : m
        )
      );
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
    resetChatSession() // Resetear el ID de sesión para comenzar conversación nueva
  try { localStorage.removeItem('chatbot_messages') } catch {}
    toast.success("Historial borrado")
  }

  const renderMessage = (text: string) => {
    return (
      <div className="prose prose-sm max-w-none text-card-foreground">
        <ReactMarkdown
          components={{
            // Texto en negrita usa el color primario
            strong: ({node, ...props}) => (
              <span className="font-bold text-primary" {...props} />
            ),
            // Texto en cursiva usa el color secundario
            em: ({node, ...props}) => (
              <span className="italic text-secondary" {...props} />
            ),
            // Bloques de código usan los colores del tema
            code: ({node, ...props}) => (
              <code className="bg-muted/50 text-accent rounded px-1" {...props} />
            ),
            // Listas mantienen el color del texto principal
            li: ({node, ...props}) => (
              <li className="my-0 text-card-foreground" {...props} />
            ),
            // Enlaces: SPA para rutas internas y nueva pestaña para externas
            a: ({ node, ...props }) => {
              const href = (props as any).href as string | undefined
              const isInternal = !!href && href.startsWith('/')
              const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                if (isInternal && href) {
                  e.preventDefault()
                  navigate(href)
                }
              }
              return (
                <a
                  className="text-accent hover:text-accent/80 underline"
                  href={href}
                  onClick={onClick}
                  target={isInternal ? undefined : "_blank"}
                  rel={isInternal ? undefined : "noopener noreferrer"}
                >
                  {props.children}
                </a>
              )
            },
            // Encabezados usan el color primario
            h1: ({node, ...props}) => (
              <h1 className="text-primary font-bold" {...props} />
            ),
            h2: ({node, ...props}) => (
              <h2 className="text-primary font-bold" {...props} />
            ),
            h3: ({node, ...props}) => (
              <h3 className="text-primary font-bold" {...props} />
            ),
            // Párrafos usan el color del texto principal
            p: ({node, ...props}) => (
              <p className="text-card-foreground" {...props} />
            )
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-4 bg-primary hover:bg-primary hover:bg-opacity-90 text-primary-foreground rounded-full shadow-lg"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-4 right-4 flex flex-col h-[600px] w-full max-w-[400px] bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden backdrop-blur-sm"
        initial={{ opacity: 0, scale: 0.3, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.3, y: 100 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      >
        <div className="flex justify-between items-center p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Asistente Virtual</h2>
          </div>
          <div className="flex gap-1">
            <button
              onClick={clearHistory}
              className="p-2 hover:bg-accent/20 rounded-lg text-muted-foreground hover:text-accent transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-destructive/20 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-background/50 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} items-end gap-2`}
            >
              {!message.isUser && (
                <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-secondary" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  message.isUser
                    ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground bg-primary'
                    : 'bg-gradient-to-br from-secondary/90 to-secondary text-card-foreground'
                } shadow-sm`}
              >
                {message.isUser ? (
                  message.text
                ) : isWaitingResponse && message.text === "" ? (
                  <span className="flex gap-1 items-center h-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                ) : (
                  renderMessage(message.text)
                )}
                
                {!message.isUser && !message.hasFeedback && (
                  <div className="flex justify-end mt-2 gap-1 border-t border-foreground/10 pt-2">
                    <button 
                      onClick={() => handleFeedback(message.id!, true)}
                      className="p-1.5 hover:bg-foreground/20 rounded-lg transition-colors text-foreground"
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </button>
                    <button 
                      onClick={() => handleFeedback(message.id!, false)}
                      className="p-1.5 hover:bg-foreground/20 rounded-lg transition-colors text-foreground"
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-none p-4 border-t border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre algo..."
              disabled={loading}
              className="flex-1 p-2.5 bg-background/80 text-foreground border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="p-2.5 bg-gradient-to-r from-primary to-primary/90 bg-primary text-card hover:text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
            >
              <SendHorizontal className="h-5 w-5" />
            </button>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}