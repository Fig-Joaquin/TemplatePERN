import { formatPriceCLP } from '../../../utils/formatPriceCLP';

export abstract class BaseContextProvider {
  protected formatPrice(amount: number | null | undefined): string {
    return amount ? formatPriceCLP(amount) : 'Sin monto registrado';
  }
  
  protected formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'Fecha no registrada';
    return new Date(date).toLocaleDateString('es-CL');
  }

  /**
   * Returns context data specific to this provider based on the query
   */
  abstract getContext(query: string): Promise<string>;
  
  /**
   * Determines if this provider should handle the given query
   */
  abstract shouldHandleQuery(query: string): boolean;
}
