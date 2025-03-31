import axios from 'axios';
import { config } from '../../config/config';
import { dbSchema } from '../../config/dbSchema';

interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  done_reason?: string;
}

async function streamOllamaResponse(url: string, data: any): Promise<string> {
  try {
    const response = await axios.post(url, data, { responseType: 'stream' });
    return new Promise((resolve, reject) => {
      let fullContent = '';
      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim());
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line) as OllamaResponse;
            if (parsed.message?.content) fullContent += parsed.message.content;
          } catch (e) {
            console.warn('Error parsing chunk:', line);
          }
        }
      });
      response.data.on('end', () => resolve(fullContent));
      response.data.on('error', (err: Error) => reject(err));
    });
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to get Ollama response');
  }
}

function cleanSql(sql: string): string {
  return sql
    .replace(/^[^]*?(SELECT|INSERT|UPDATE|DELETE)/i, '$1')
    .replace(/```sql|```|La consulta SQL válida.*?\n/g, '')
    .replace(/;[^]*$/, ';')
    .trim();
}

export async function generateSQL(question: string): Promise<string> {
  // Check for conversational queries
  if (/^(hola|saludos|buenos días|buenas tardes|buenas noches|qué tal|como estás|gracias|ayuda|help)/i.test(question.trim())) {
    throw new Error("CONVERSATIONAL_QUERY");
  }
  
  // Simple schema formatting
  const tables = Object.entries(dbSchema).map(([tableName, schema]) => {
    const columns = Object.keys(schema.columns).join(', ');
    return `${tableName}: ${columns}`;
  }).join('\n');
  
  console.log('Available tables:', tables);
  // Basic prompt
  const prompt = `Tablas:\n${tables}\n\nGenera SQL para: ${question}\n\nSolo SQL:`;

  try {
    let sql = await streamOllamaResponse(`${config.ollama.url}/api/chat`, {
      model: config.ollama.model,
      messages: [{ role: "user", content: prompt }],
      stream: true
    });
    
    sql = cleanSql(sql);
    

    
    return sql;
  } catch (error) {
    console.error('Error generando SQL:', error);
    throw new Error('Failed to generate SQL');
  }
}

export async function generateResponse(question: string, sqlResult: any[]): Promise<string> {
  if (!sqlResult || sqlResult.length === 0) {
    return "No se encontraron resultados";
  }

  try {
    const response = await streamOllamaResponse(`${config.ollama.url}/api/chat`, {
      model: config.ollama.model,
      messages: [{ 
        role: "user", 
        content: `Pregunta: "${question}"\nResultados: ${JSON.stringify(sqlResult)}\n\nResponde:` 
      }],
      stream: true
    });
    
    return response.trim();
  } catch (error) {
    console.error('Error generando respuesta:', error);
    return "No se pudo generar una respuesta";
  }
}

export async function resetOllamaContext(_sessionId: any): Promise<boolean> {
  try {
    await axios.post(`${config.ollama.url}/api/chat`, {
      model: config.ollama.model,
      messages: []
    });
    return true;
  } catch (error) {
    console.error('Error reseteando contexto:', error);
    return false;
  }
}

export async function getConversationalResponse(question: string): Promise<string> {
  try {
    const response = await streamOllamaResponse(`${config.ollama.url}/api/chat`, {
      model: config.ollama.model,
      messages: [{ role: "user", content: `Responde: ${question}` }],
      stream: true
    });
    
    return response.trim();
  } catch (error) {
    console.error('Error en respuesta conversacional:', error);
    return "Hola, ¿en qué puedo ayudarte?";
  }
}
