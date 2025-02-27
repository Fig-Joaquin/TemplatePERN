import { BaseContextProvider } from './BaseContextProvider';
import { AppDataSource } from '../../../config/ormconfig';
import { Quotation, WorkProductDetail } from '../../../entities';

export class QuotationContextProvider extends BaseContextProvider {
  shouldHandleQuery(query: string): boolean {
    const keywords = [
      'cotización', 'cotizacion', 'cotizar', 'presupuesto', 'valor', 'precio',
      'cotizaciones', 'cuanto cuesta', 'cuánto cuesta', 'cuanto sale', 'cuánto sale'
    ];
    return keywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  async getContext(query: string): Promise<string> {
    try {
      // Check for specific quotation ID request
      const idMatch = query.match(/cotizaci[oó]n\s*[#]?\s*(\d+)/i);
      const specificId = idMatch ? parseInt(idMatch[1]) : null;
      
      const quotationRepository = AppDataSource.getRepository(Quotation);
      const workProductDetailRepository = AppDataSource.getRepository(WorkProductDetail);
      
      // Get total counts for all quotations
      const totalCount = await quotationRepository.count();
      const pendingCount = await quotationRepository.count({ where: { quotation_Status: 'pending' } });
      const approvedCount = await quotationRepository.count({ where: { quotation_Status: 'approved' } });
      const rejectedCount = await quotationRepository.count({ where: { quotation_Status: 'rejected' } });
      
      // If looking for a specific quotation
      if (specificId) {
        const specificQuotation = await quotationRepository.findOne({
          where: { quotation_id: specificId },
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
        
        if (!specificQuotation) {
          return `DATOS CONCRETOS: No existe la cotización #${specificId} en la base de datos.
          
RESUMEN DE COTIZACIONES:
- Total de cotizaciones: ${totalCount}
- Cotizaciones pendientes: ${pendingCount}
- Cotizaciones aprobadas: ${approvedCount}
- Cotizaciones rechazadas: ${rejectedCount}`;
        }
        
        // Get product details for this specific quotation
        const details = await workProductDetailRepository.find({
          where: { quotation: { quotation_id: specificQuotation.quotation_id } },
          relations: ['product']
        });
        
        const statusText = 
          specificQuotation.quotation_Status === 'pending' ? 'Pendiente' :
          specificQuotation.quotation_Status === 'approved' ? 'Aprobada' :
          specificQuotation.quotation_Status === 'rejected' ? 'Rechazada' :
          'Desconocido';
          
        const ownerName = specificQuotation.vehicle?.owner?.name || 'No especificado';
        const companyName = specificQuotation.vehicle?.company?.name || '';
        const clientName = companyName || ownerName;
          
        return `DATOS CONCRETOS DE LA COTIZACIÓN #${specificId}:

COTIZACIÓN #${specificQuotation.quotation_id}
* Cliente: ${clientName}
* Vehículo: ${specificQuotation.vehicle?.model?.brand?.brand_name || ''} ${specificQuotation.vehicle?.model?.model_name || ''} (${specificQuotation.vehicle?.license_plate || 'Sin patente'})
* Estado: ${statusText}
* Fecha: ${this.formatDate(specificQuotation.entry_date)}
* Total: ${this.formatPrice(specificQuotation.total_price)}
* Productos: ${details.length > 0 ? 
          details.map(d => `${d.product.product_name} (${d.quantity} unidades a ${this.formatPrice(d.sale_price)})`).join(', ') : 
          'Sin productos registrados'}
          
RESUMEN GENERAL:
- Total de cotizaciones en el sistema: ${totalCount}`;
      }
      
      // Normal case: Get all quotations
      const quotations = await quotationRepository.find({
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
          entry_date: 'DESC'
        },
        take: 15 // Increased for more comprehensive context
      });
      
      if (quotations.length === 0) {
        return "DATOS CONCRETOS: No hay cotizaciones registradas en el sistema actualmente.";
      }
      
      // Start with summary statistics in a very clear format
      let context = `DATOS CONCRETOS DE COTIZACIONES:

RESUMEN ESTADÍSTICO:
- Total de cotizaciones en el sistema: ${totalCount}
- Cotizaciones pendientes: ${pendingCount}
- Cotizaciones aprobadas: ${approvedCount}
- Cotizaciones rechazadas: ${rejectedCount}

LISTA COMPLETA DE COTIZACIONES:
`;

      // Add details for all quotations with clear formatting
      for (const quotation of quotations) {
        // Get product details for this quotation
        const details = await workProductDetailRepository.find({
          where: { quotation: { quotation_id: quotation.quotation_id } },
          relations: ['product']
        });
        
        const statusText = 
          quotation.quotation_Status === 'pending' ? 'Pendiente' :
          quotation.quotation_Status === 'approved' ? 'Aprobada' :
          quotation.quotation_Status === 'rejected' ? 'Rechazada' :
          'Desconocido';
          
        const ownerName = quotation.vehicle?.owner?.name || 'No especificado';
        const companyName = quotation.vehicle?.company?.name || '';
        const clientName = companyName || ownerName;
          
        context += `
COTIZACIÓN #${quotation.quotation_id}:
* Cliente: ${clientName}
* Vehículo: ${quotation.vehicle?.model?.brand?.brand_name || ''} ${quotation.vehicle?.model?.model_name || ''} (${quotation.vehicle?.license_plate || 'Sin patente'})
* Estado: ${statusText}
* Fecha: ${this.formatDate(quotation.entry_date)}
* Total: ${this.formatPrice(quotation.total_price)}
* Productos: ${details.length > 0 ? 
    details.map(d => `${d.product.product_name} (${d.quantity} unidades a ${this.formatPrice(d.sale_price)})`).join(', ') : 
    'Sin productos registrados'}
`;
      }
      
      return context;
    } catch (error) {
      console.error('Error getting quotations context:', error);
      return "Error al obtener información de cotizaciones de la base de datos.";
    }
  }
}
