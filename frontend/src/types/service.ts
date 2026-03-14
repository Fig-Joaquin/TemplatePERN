export interface Service {
  service_id: number
  service_name: string
  description?: string
  base_price: number
  is_active: boolean
  created_date?: string
  updated_at?: string
}

export interface SelectedService {
  serviceId: number
  serviceName: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  quotationServiceId?: number  // ID del detalle existente en backend (para edición)
  workOrderServiceId?: number  // ID del detalle existente en backend (para edición)
}

export interface QuotationServiceDetail {
  id: number
  quotation_id: number
  service_id: number
  service: Service
  cantidad: number
  precio_unitario: number
  subtotal: number
  created_at?: string
  updated_at?: string
}

export interface WorkOrderServiceDetail {
  id: number
  work_order_id: number
  service_id: number
  service: Service
  cantidad: number
  precio_unitario: number
  subtotal: number
  created_at?: string
  updated_at?: string
}
