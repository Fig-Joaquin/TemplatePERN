import { BaseContextProvider } from './context/BaseContextProvider';
import { QuotationContextProvider } from './context/QuotationContextProvider';
import { WorkOrderContextProvider } from './context/WorkOrderContextProvider';
import { InventoryContextProvider } from './context/InventoryContextProvider';
import { StatisticsContextProvider } from './context/StatisticsContextProvider';

/**
 * Provides database context for Ollama based on user query
 */
export class DatabaseContextProvider {
  private static providers: BaseContextProvider[] = [
    new InventoryContextProvider(),
    new QuotationContextProvider(),
    new WorkOrderContextProvider(),
    new StatisticsContextProvider()
  ];

  static async getContextForQuery(query: string): Promise<string> {
    try {
      const lowerQuery = query.toLowerCase();
      const contextPromises: Promise<string>[] = [];
      
      // Always add statistics for basic context
      const statisticsProvider = this.providers.find(p => p instanceof StatisticsContextProvider);
      if (statisticsProvider) {
        contextPromises.push(statisticsProvider.getContext(lowerQuery));
      }
      
      // Find providers that should handle this query
      const relevantProviders = this.providers.filter(
        p => !(p instanceof StatisticsContextProvider) && p.shouldHandleQuery(lowerQuery)
      );
      
      // If no specialized handlers found, default to quotation context
      if (relevantProviders.length === 0) {
        const quotationProvider = this.providers.find(p => p instanceof QuotationContextProvider);
        if (quotationProvider) {
          contextPromises.push(quotationProvider.getContext(lowerQuery));
        }
      } else {
        // Add context from all relevant providers
        for (const provider of relevantProviders) {
          contextPromises.push(provider.getContext(lowerQuery));
        }
      }
      
      // Get context from all providers
      const contextSections = await Promise.all(contextPromises);
      
      console.log("Database context generated successfully");
      
      // Combine all context sections with clear formatting
      return `
DATOS OFICIALES DEL SISTEMA (FECHA: ${new Date().toLocaleDateString('es-CL')}):
${contextSections.join('\n\n')}

INSTRUCCIONES PARA RESPONDER:
1. UTILIZA EXCLUSIVAMENTE LOS DATOS PROPORCIONADOS ARRIBA.
2. NO INVENTES INFORMACIÓN. NO USES MARCADORES COMO "[Nombre]" O "[Monto]". USA LOS VALORES REALES.
3. Si preguntan "cuántas cotizaciones hay", responde con el número exacto según el RESUMEN ESTADÍSTICO.
4. Si preguntan por cotizaciones pendientes, muestra LA LISTA COMPLETA de todas las cotizaciones pendientes con sus detalles.
5. Si preguntan por una cotización específica (ej: "cotización #1"), muestra SOLO esa cotización.
6. Si no hay datos disponibles, indica claramente "No hay datos disponibles en el sistema".`;
    } catch (error) {
      console.error('Error in getContextForQuery:', error);
      return "Error al obtener contexto de la base de datos.";
    }
  }
}
