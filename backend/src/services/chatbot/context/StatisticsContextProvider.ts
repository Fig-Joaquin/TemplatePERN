import { BaseContextProvider } from './BaseContextProvider';
import { AppDataSource } from '../../../config/ormconfig';
import { Quotation, WorkOrder, StockProduct } from '../../../entities';

export class StatisticsContextProvider extends BaseContextProvider {
  shouldHandleQuery(_query: string): boolean {
    // Statistics provider is always called for basic context
    return true;
  }

  async getContext(_query: string): Promise<string> {
    try {
      const quotationRepository = AppDataSource.getRepository(Quotation);
      const workOrderRepository = AppDataSource.getRepository(WorkOrder);
      const stockRepository = AppDataSource.getRepository(StockProduct);
      
      const quotationCount = await quotationRepository.count();
      const workOrderCount = await workOrderRepository.count();
      const stockCount = await stockRepository.count();
      
      // Get quotation values (total values of all quotations)
      const quotationValueResult = await quotationRepository
        .createQueryBuilder('quotation')
        .select('SUM(quotation.total_price)', 'total')
        .getRawOne();
      
      const totalQuotationValue = quotationValueResult?.total || 0;
      
      // Get work order values
      const orderValueResult = await workOrderRepository
        .createQueryBuilder('order')
        .select('SUM(order.total_amount)', 'total')
        .getRawOne();
      
      const totalOrderValue = orderValueResult?.total || 0;
      
      return `ESTADÍSTICAS GENERALES DEL SISTEMA:
- Cotizaciones registradas: ${quotationCount} (Valor total: ${this.formatPrice(totalQuotationValue)})
- Órdenes de trabajo registradas: ${workOrderCount} (Valor total: ${this.formatPrice(totalOrderValue)})
- Productos diferentes en inventario: ${stockCount}
`;
    } catch (error) {
      console.error('Error getting statistics context:', error);
      return "Error al obtener estadísticas del sistema.";
    }
  }
}
