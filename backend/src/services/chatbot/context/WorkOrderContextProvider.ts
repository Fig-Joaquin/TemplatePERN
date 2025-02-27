import { BaseContextProvider } from './BaseContextProvider';
import { AppDataSource } from '../../../config/ormconfig';
import { WorkOrder } from '../../../entities';

export class WorkOrderContextProvider extends BaseContextProvider {
  shouldHandleQuery(query: string): boolean {
    const keywords = [
      'orden', 'trabajo', 'reparación', 'reparacion', 'servicio', 'taller',
      'órdenes', 'ordenes', 'trabajos', 'servicios', 'reparaciones'
    ];
    return keywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  async getContext(query: string): Promise<string> {
    try {
      // Check for specific work order ID request
      const idMatch = query.match(/orden\s*[#]?\s*(\d+)/i);
      const specificId = idMatch ? parseInt(idMatch[1]) : null;
      
      const workOrderRepository = AppDataSource.getRepository(WorkOrder);
      
      // If looking for a specific work order
      if (specificId) {
        const specificOrder = await workOrderRepository.findOne({
          where: { work_order_id: specificId },
          relations: {
            vehicle: {
              owner: true,
              company: true,
              model: {
                brand: true
              }
            }
          }
        });
        
        if (!specificOrder) {
          return `DATOS: Se buscó la orden de trabajo #${specificId} pero NO EXISTE en la base de datos.`;
        }
        
        return `DATOS ESPECÍFICOS DE LA ORDEN DE TRABAJO #${specificId}:

ORDEN #${specificOrder.work_order_id}:
- Cliente: ${specificOrder.vehicle?.owner?.name || specificOrder.vehicle?.company?.name || 'No especificado'}
- Vehículo: ${specificOrder.vehicle?.model?.brand?.brand_name || ''} ${specificOrder.vehicle?.model?.model_name || ''}
- Estado: ${specificOrder.order_status}
- Fecha: ${this.formatDate(specificOrder.order_date)} 
- Total: ${this.formatPrice(specificOrder.total_amount)}
- Descripción: ${specificOrder.description || 'Sin descripción'}`;
      }
      
      const workOrders = await workOrderRepository.find({
        relations: {
          vehicle: {
            owner: true,
            company: true,
            model: {
              brand: true
            }
          }
        },
        order: {
          order_date: 'DESC'
        },
        take: 10 // Increased for better context
      });
      
      if (workOrders.length === 0) {
        return "DATOS: No hay órdenes de trabajo registradas en el sistema.";
      }
      
      const orderCount = await workOrderRepository.count();
      const pendingCount = await workOrderRepository.count({ where: { order_status: 'pending' } });
      const completedCount = await workOrderRepository.count({ where: { order_status: 'completed' } });
      
      let context = `DATOS REALES DE ÓRDENES DE TRABAJO:

RESUMEN ESTADÍSTICO:
- Total de órdenes: ${orderCount}
- Órdenes pendientes: ${pendingCount}
- Órdenes completadas: ${completedCount}

LISTA DE ÓRDENES DE TRABAJO:
`;
      
      workOrders.forEach(order => {
        context += `
ORDEN #${order.work_order_id}:
- Cliente: ${order.vehicle?.owner?.name || order.vehicle?.company?.name || 'No especificado'}
- Vehículo: ${order.vehicle?.model?.brand?.brand_name || ''} ${order.vehicle?.model?.model_name || ''}
- Estado: ${order.order_status}
- Fecha: ${this.formatDate(order.order_date)} 
- Total: ${this.formatPrice(order.total_amount)}
- Descripción: ${order.description || 'Sin descripción'}
`;
      });
      
      return context;
    } catch (error) {
      console.error('Error getting work orders context:', error);
      return "Error al obtener información de órdenes de trabajo.";
    }
  }
}
