/**
 * Sanitizes AI responses to remove meta instructions or self-references
 * 
 * @param response The raw AI response
 * @returns Cleaned response without meta instructions
 */
export function sanitizeResponse(response: string): string {
  // List of patterns that indicate meta-instructions rather than direct responses
  const metaInstructionPatterns = [
    /para ayudarte a mejorar/i,
    /te recomiendo incluir/i,
    /instrucciones adicionales/i,
    /siguientes instrucciones/i,
    /pasos desnecessarios/i,
    /una vez que has terminado la búsqueda/i,
    /hace referencia al sistema/i,
    /utiliza la información de cotizaciones/i,
    /menciona cotizaciones para otros clientes/i,
    /indica la fecha y hora/i,
    /utiliza el nombre del cliente/i,
    /mención a los productos/i,
    /indica un estado/i,
    /según el contexto proporcionado/i,
    /asegúrate de/i,
    /recuerda incluir/i,
    /no olvides mencionar/i,
    /usa datos reales de/i
  ];

  // Example data patterns that should be removed or flagged
  const exampleDataPatterns = [
    /(Juan Pérez|María López|Pedro Gómez)(?!.*\[EJEMPLO\])/i,
    /Cotización #(AAA|BBB|CCC|127|128)(?!.*\[EJEMPLO\])/i,
    /Toyota Corolla.*Ford Focus/i,
    /\$250\.000.*\$180\.000/i
  ];

  // Placeholder patterns to be replaced
  const placeholderPatterns = [
    {pattern: /\[Nombre\]/g, replacement: "nombre no disponible"},
    {pattern: /\[Marca y modelo reales\]/g, replacement: "vehículo no especificado"},
    {pattern: /\[Estado real\]/g, replacement: "estado no especificado"},
    {pattern: /\[Monto real\]/g, replacement: "monto no disponible"},
    {pattern: /\[Monto\]/g, replacement: "monto no disponible"}
  ];

  // Generic greeting to replace meta-instruction responses for simple queries
  const genericGreeting = "¡Hola! Bienvenido al Taller Mecánico. ¿En qué puedo ayudarte hoy?";
  
  // Add these new patterns to detect system instructions
  const systemInstructionPatterns = [
    /REGLA\s+#\d+/i,
    /===\s*DATOS\s+DE\s+LA\s+BASE\s+DE\s+DATOS\s*===/i,
    /<DATA>.*?<\/DATA>/s,
    /INSTRUCCIONES\s+PARA\s+RESPONDER/i,
    /UTILIZA\s+EXCLUSIVAMENTE\s+LOS\s+DATOS\s+PROPORCIONADOS/i
  ];

  // Check if response contains example data instead of real data
  for (const pattern of exampleDataPatterns) {
    if (pattern.test(response)) {
      console.warn('Warning: Response contains example data. Instructing not to use examples.');
      
      // If response is about quotations and contains example data, add warning
      if (response.toLowerCase().includes('cotizacion') || response.toLowerCase().includes('cotización')) {
        return "Atención: No puedo mostrar la información de cotizaciones en este momento. Por favor, consulta directamente en el sistema.";
      }
    }
  }
  
  // Replace placeholder patterns with more honest responses
  let sanitized = response;
  for (const {pattern, replacement} of placeholderPatterns) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  
  // If the response still contains placeholders, provide clearer error message
  if (sanitized.includes("[") && sanitized.includes("]")) {
    const placeholderMatch = sanitized.match(/\[([^\]]+)\]/);
    if (placeholderMatch) {
      console.warn(`Detected placeholder pattern: ${placeholderMatch[0]}`);
    }
  }
  
  // Don't apply filtering to responses that contain actual data from the database
  if (response.includes('Cotización #') || 
      response.includes('Orden #') || 
      response.includes('Stock disponible') ||
      response.includes('Total de cotizaciones')) {
    // Still remove obvious meta-instructions at beginning/end
    let cleanedResponse = sanitized;
    cleanedResponse = cleanedResponse.replace(/^(Para ayudarte|Una vez que has terminado|Las instrucciones|Siguiendo las instrucciones).*?\n/i, '');
    cleanedResponse = cleanedResponse.replace(/\n(Para ayudarte|Una vez que has terminado|Las instrucciones|Siguiendo las instrucciones).*?$/i, '');
    return cleanedResponse.trim();
  }
  
  // Check if the response contains meta-instructions
  const containsMetaInstructions = metaInstructionPatterns.some(pattern => 
    pattern.test(response)
  );
  
  // Check for system instructions
  const hasSystemInstructions = systemInstructionPatterns.some(pattern => pattern.test(response));
  
  if (hasSystemInstructions) {
    // If response contains system instructions, clean them up
    let cleaned = response;
    
    // Remove section between DATA tags
    cleaned = cleaned.replace(/<DATA>.*?<\/DATA>/s, '');
    
    // Remove rules
    cleaned = cleaned.replace(/REGLA\s+#\d+:.*$/gm, '');
    cleaned = cleaned.replace(/^.*REGLA\s+#\d+.*$/gm, '');
    
    // Remove data section headers
    cleaned = cleaned.replace(/===\s*DATOS\s+DE\s+LA\s+BASE\s+DE\s+DATOS\s*===.*?===/s, '');
    cleaned = cleaned.replace(/DATOS\s+OFICIALES\s+DEL\s+SISTEMA.*?:/i, '');
    cleaned = cleaned.replace(/INSTRUCCIONES\s+PARA\s+RESPONDER:[\s\S]*?(?=\n\n|\n$|$)/i, '');
    
    // Clean up any resulting multiple newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // If we've cleaned too much, use generic greeting
    if (cleaned.trim().length < 20) {
      return genericGreeting;
    }
    
    return cleaned.trim();
  }
  
  if (containsMetaInstructions) {
    // If the response is mostly meta-instructions, replace with generic greeting
    if (response.length > 200 && 
        metaInstructionPatterns.filter(p => p.test(response)).length >= 3) {
      return genericGreeting;
    }
    
    // Otherwise try to clean up the response
    let cleanedResponse = sanitized;
    
    // Remove numbered instruction lists
    cleanedResponse = cleanedResponse.replace(/\d+\.\s*(Hace referencia|Utiliza|Menciona|Indica|Mención).*?(\n|$)/g, '');
    
    // Remove meta-instruction paragraphs
    cleanedResponse = cleanedResponse.replace(/Para ayudarte.*?[\.\n]/g, '');
    cleanedResponse = cleanedResponse.replace(/Una vez que has terminado.*?$/g, '');
    
    // If we've removed too much, use generic greeting
    if (cleanedResponse.trim().length < 20) {
      return genericGreeting;
    }
    
    return cleanedResponse.trim();
  }
  
  // Response seems fine, return as is
  return sanitized;
}
