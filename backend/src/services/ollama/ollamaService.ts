import axios from 'axios';
import { config } from '../../config/config';
import { dbSchema, dbRelationships } from '../../config/dbSchema';

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

function validateSqlQuery(sql: string): { isValid: boolean, errorMessage?: string } {
  const availableTables = Object.keys(dbSchema).map(t => t.toLowerCase());
  const availableColumns = Object.entries(dbSchema).reduce((acc, [table, cols]) => {
    acc[table.toLowerCase()] = Object.keys(cols.columns).map(c => c.toLowerCase());
    return acc;
  }, {} as Record<string, string[]>);
  
  // Validar que la consulta comience con SELECT
  if (!sql.trim().toLowerCase().startsWith('select')) {
    return { isValid: false, errorMessage: 'La consulta debe comenzar con SELECT' };
  }

  // Validar complejidad excesiva
  if (sql.split('JOIN').length > 5) {
    return { isValid: false, errorMessage: 'Consulta demasiado compleja, simplifica los joins' };
  }

  // Validar GROUP BY incorrecto
  const hasGroupBy = /GROUP\s+BY/i.test(sql);
  const hasAggregateFunction = /COUNT|SUM|AVG|MIN|MAX/i.test(sql);
  if (hasGroupBy && !hasAggregateFunction) {
    return { isValid: false, errorMessage: 'GROUP BY innecesario o mal utilizado' };
  }

  // Extraer tablas utilizadas en la consulta
  const tableRegex = /(?:FROM|JOIN)\s+(\w+)/gi;
  const tablesInQuery: string[] = [];
  let tableMatch;
  while ((tableMatch = tableRegex.exec(sql)) !== null) {
    const table = tableMatch[1].toLowerCase();
    if (!availableTables.includes(table)) {
      return { isValid: false, errorMessage: `Tabla inválida: ${table}` };
    }
    tablesInQuery.push(table);
  }
  
  // Validar columnas en SELECT
  // Primero extraemos la cláusula SELECT
  const selectClauseMatch = /SELECT\s+(.*?)\s+FROM/is.exec(sql);
  if (selectClauseMatch) {
    const selectClause = selectClauseMatch[1];
    // Analizamos cada columna mencionada en el SELECT
    const selectColumns = selectClause.split(',').map(col => col.trim());
    
    for (const col of selectColumns) {
      // Ignorar funciones de agregación y comodines
      if (/COUNT\s*\(\s*\*\s*\)|COUNT\s*\(\s*\w+\s*\)|SUM|AVG|MIN|MAX|\*/.test(col)) {
        continue;
      }
      
      // Verificar columnas con alias
      const asMatch = /^(.*?)\s+(?:AS\s+|as\s+)["']?\w+["']?$/.exec(col);
      const columnToCheck = asMatch ? asMatch[1].trim() : col;
      
      // Si la columna tiene referencia de tabla
      if (columnToCheck.includes('.')) {
        const [table, column] = columnToCheck.toLowerCase().split('.');
        if (!availableColumns[table]?.includes(column)) {
          return { isValid: false, errorMessage: `Columna inválida: ${column} en ${table}` };
        }
      } else {
        // Si no tiene referencia de tabla, verificar en todas las tablas utilizadas
        const columnName = columnToCheck.toLowerCase();
        let foundInAnyTable = false;
        
        for (const table of tablesInQuery) {
          if (availableColumns[table]?.includes(columnName)) {
            foundInAnyTable = true;
            break;
          }
        }
        
        if (!foundInAnyTable) {
          return { isValid: false, errorMessage: `Columna inválida o ambigua: ${columnName}` };
        }
      }
    }
  }

  // Validar columnas en cláusulas WHERE, ORDER BY, etc.
  const columnRegex = /(\w+)\.(\w+)/gi;
  let columnMatch;
  while ((columnMatch = columnRegex.exec(sql)) !== null) {
    const table = columnMatch[1].toLowerCase();
    const column = columnMatch[2].toLowerCase();
    if (!availableColumns[table]?.includes(column)) {
      return { isValid: false, errorMessage: `Columna inválida: ${column} en ${table}` };
    }
  }

  // Validar valores
  const valueRegex = /'([^']+)'/g;
  let valueMatch;
  while ((valueMatch = valueRegex.exec(sql)) !== null) {
    const value = valueMatch[1];
    // Permitir valores comunes y años
    if (value === 'pending' || value === 'approved' || value === 'rejected' || /^\d{4}$/.test(value)) {
      continue;
    }
    
    const valueExists = Object.values(dbRelationships).some(rel =>
      Object.values(rel).some(v => typeof v === 'string' && (v as string).toLowerCase() === value.toLowerCase())
    );
    if (!valueExists) {
      // Solo advertir sobre valores no reconocidos, no rechazar completamente
      console.warn(`Advertencia: Valor posiblemente inválido: ${value}`);
    }
  }

  return { isValid: true };
}

function cleanSql(sql: string): string {
  return sql
    .replace(/^[^]*?(SELECT|INSERT|UPDATE|DELETE)/i, '$1')
    .replace(/```sql|```|La consulta SQL válida.*?\n/g, '')
    .replace(/(as|AS)\s+'([^']+)'/g, 'AS "$2"')
    .replace(/;[^]*$/, ';')
    .trim();
}

// Función auxiliar para simplificar la presentación del esquema
function formatSchemaForPrompt(): string {
  const tableInfo = Object.entries(dbSchema).map(([tableName, schema]) => {
    const columns = Object.keys(schema.columns).join(', ');
    return `- ${tableName} (columns: ${columns})`;
  }).join('\n');
  
  // Simplifiquemos también las relaciones clave
  const relationshipInfo = Object.entries(dbRelationships)
    .map(([rel, values]) => `- ${rel}: ${JSON.stringify(values)}`)
    .join('\n');
  
  return `TABLES:\n${tableInfo}\n\nKEY RELATIONSHIPS:\n${relationshipInfo}`;
}

async function analyzeQueryRequirements(question: string): Promise<string> {
  const prompt = `
Analiza esta pregunta: "${question}"

Esquema de base de datos disponible:
${formatSchemaForPrompt()}

RESPONDE CON UN BREVE ANÁLISIS:
1. ¿Qué tablas se necesitan para responder esta pregunta?
2. ¿Se necesitan JOIN entre tablas? Si es así, ¿cuáles tablas deben unirse y por qué columnas?
3. ¿Qué tipo de consulta es más apropiada (SELECT simple, COUNT, agregación, etc.)?

Tu análisis:
`;

  const requestData = {
    model: config.ollama.model,
    messages: [{ role: "user", content: prompt }],
    stream: true,
    temperature: 0.1,
    max_tokens: 300
  };

  try {
    return await streamOllamaResponse(`${config.ollama.url}/api/chat`, requestData);
  } catch (error) {
    console.error('Error analizando requerimientos:', error);
    return '';
  }
}

export async function generateSQL(question: string): Promise<string> {
  const availableTables = Object.keys(dbSchema);
  const schemaForPrompt = formatSchemaForPrompt();
  
  // Primero analizar los requerimientos de la consulta
  const analysis = await analyzeQueryRequirements(question);
  console.log('Análisis de la consulta:', analysis);
  
  // Incorporar el análisis en el prompt principal, pero con énfasis en simplicidad
  const prompt = `
Eres un experto en PostgreSQL que genera consultas SQL PRECISAS y SIMPLES basadas ESTRICTAMENTE en el esquema proporcionado.

CONSULTA SOLICITADA: "${question}"

ANÁLISIS PREVIO:
${analysis}

ESQUEMA DE BASE DE DATOS:
${schemaForPrompt}

REGLAS CRÍTICAS (ALTO IMPACTO):
1. SIMPLICIDAD MÁXIMA - Genera la consulta más simple posible que responda la pregunta
2. NO AGREGUES CONDICIONES QUE NO SE PIDAN EXPLÍCITAMENTE
3. NO INVENTES tablas o columnas que no existan en el esquema
4. Si la pregunta pide solo datos básicos de una tabla, USA SELECT * FROM tabla
5. USA JOINS SOLO cuando sean absolutamente necesarios para responder la pregunta

REGLAS TÉCNICAS:
1. Para alias usa COMILLAS DOBLES: AS "alias"
2. Usa la palabra clave "AS" para todos los alias
3. Usa los nombres EXACTOS de las columnas y tablas del esquema

IMPORTANTE: Genera SOLO la consulta SQL válida, sin explicaciones adicionales.
`;

  console.log('Esquema:', schemaForPrompt);
  console.log('Tablas disponibles:', availableTables);

  const requestData = {
    model: config.ollama.model,
    messages: [{ role: "user", content: prompt }],
    stream: true,
    temperature: 0.1,
    max_tokens: 400
  };

  try {
    let sql = await streamOllamaResponse(`${config.ollama.url}/api/chat`, requestData);
    sql = cleanSql(sql);

    const validation = validateSqlQuery(sql);
    if (!validation.isValid || !sql.trim().startsWith('SELECT')) {
      console.log('Validación fallida:', validation.errorMessage);
      
      const retryPrompt = `
ERROR EN LA CONSULTA SQL: ${validation.errorMessage || 'Formato SQL inválido'}

Necesito una consulta SQL EXTREMADAMENTE SIMPLE para: "${question}"

INSTRUCCIONES CRÍTICAS:
1. Genera la consulta MÁS BÁSICA posible que responda la pregunta
2. NO AGREGUES condiciones o filtros que no se soliciten explícitamente
3. NO USES joins a menos que sean ABSOLUTAMENTE necesarios
4. NO USES tablas que no estén directamente relacionadas con la pregunta
5. Usa solo columnas que existen en estas tablas: ${availableTables.join(', ')}

La consulta debe ser válida en PostgreSQL estándar.
Responde ÚNICAMENTE con la consulta SQL, sin explicaciones.
`;

      // Reset context for retry
      requestData.messages = [{ role: "user", content: retryPrompt }];
      sql = await streamOllamaResponse(`${config.ollama.url}/api/chat`, requestData);
      return cleanSql(sql);
    }

    return sql;
  } catch (error) {
    console.error('Error generando SQL:', error);
    throw new Error('No se pudo generar la consulta');
  }
}

export async function generateResponse(question: string, sqlResult: any[]): Promise<string> {
  if (!sqlResult || sqlResult.length === 0) {
    return "No se encontraron resultados para esta consulta";
  }

  const prompt = `
Eres un asistente experto que interpreta resultados SQL.
Pregunta: "${question}"
Resultado: ${JSON.stringify(sqlResult, null, 2)}

INSTRUCCIONES:
1. Responde en español claro y conciso
2. Usa EXCLUSIVAMENTE los datos proporcionados
3. Si se pide un número, muestra el valor exacto
4. No menciones SQL en la respuesta
5. No inventes datos adicionales
`;

  const requestData = {
    model: config.ollama.model,
    messages: [{ role: "user", content: prompt }],
    stream: true,
    temperature: 0.1
  };

  try {
    const response = await streamOllamaResponse(`${config.ollama.url}/api/chat`, requestData);
    return response.trim().replace(/["']/g, '');
  } catch (error) {
    console.error('Error generando respuesta:', error);
    throw new Error('No se pudo generar la respuesta');
  }
}

export async function resetOllamaContext(sessionId: string): Promise<boolean> {
  try {
    await axios.post(`${config.ollama.url}/api/chat`, {
      model: config.ollama.model,
      messages: []
    });

    console.log('Contexto de Ollama reseteado', sessionId);
    return true;
  } catch (error) {
    console.error('Error reseteando contexto:', error);
    return false;
  }
}
