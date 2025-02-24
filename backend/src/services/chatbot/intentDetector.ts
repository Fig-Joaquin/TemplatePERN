const intentKeywords = {
  stock: new Set([
    'stock', 'cantidad', 'quedan', 'hay', 'disponible', 'inventario', 'existencia',
    'almacen', 'bodega', 'productos', 'unidades', 'disponibilidad', 'queda',
    'stockear', 'almacenar', 'guardar'
  ]),
  quotation: new Set([
    'cotizacion', 'cotizar', 'precio', 'presupuesto', 'valor', 'listar', 
    'mostrar', 'todas', 'pendientes', 'estado', 'mayor', 'mas', 'cara', 
    'reciente', 'ultima', 'cotizaciones', 'costo', 'vale', 'cuanto', 'cuánto',
    'presupuestar', 'cotizame', 'cotízame', 'cuestan', 'valen'
  ]),
  workOrder: new Set([
    'orden', 'trabajo', 'reparacion', 'servicio', 'mantenimiento',
    'arreglo', 'revision', 'revisión', 'reparar', 'mantener', 'revisar',
    'diagnostico', 'diagnóstico', 'taller', 'mecanico', 'mecánico'
  ])
};

// src/services/chatbot/intentDetector.ts
export const detectIntent = (tokens: string[]) => {
  const normalizedTokens = tokens.map(token => token.toLowerCase());
  
  // Calcular puntuación para cada intención
  const scores = Object.entries(intentKeywords).map(([intent, keywords]) => {
    const score = normalizedTokens.reduce((total, token) => {
      // Puntuación exacta
      if (keywords.has(token)) return total + 1;
      
      // Puntuación por similitud
      const similarWord = Array.from(keywords).find(keyword => 
        levenshteinDistance(token, keyword) <= 2
      );
      if (similarWord) return total + 0.5;
      
      return total;
    }, 0);
    
    return { intent, score };
  });

  // Encontrar la intención con mayor puntuación
  const bestMatch = scores.reduce((prev, current) => 
    current.score > prev.score ? current : prev
  );

  return bestMatch.score > 0 ? bestMatch.intent : 'unknown';
};

// Función simple de distancia de Levenshtein
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator,
      );
    }
  }
  return track[str2.length][str1.length];
}