import type React from "react"
export interface Person {
  person_id: number
  name: string
  first_surname: string
  second_surname?: string
  email: string
  number_phone: string
  person_type: string
  rut: string
}

export interface User {
  id: number
  username: string
  userRole: string
  person: Person
}

export interface ClientFormProps {
  formData: {
    name: string
    first_surname: string
    second_surname?: string
    email: string
    number_phone: string
    person_type: string
    rut: string
  }
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isCreating?: boolean
}

export interface Vehicle {
  vehicle_id: number
  license_plate: string
  vehicle_status: "running" | "not_running"
  vehicle_model_id: number
  model?: Model
  mileage_history: MileageHistory[]
  color: string
  year?: number // Changed to optional
  owner: Person | null // Allow owner to be null
  company: Company | null // Allow company to be null
  person_id?: number // For creating vehicles
  company_id?: number // For creating vehicles
  mileageHistory?: number // For creating vehicles with initial mileage
}


export interface Company {
  company_id: number;
  rut: string;
  name: string;
  email: string;
  phone?: string;
  vehicles?: Vehicle[]; // Optional array of vehicles
}

export interface Model {
  vehicle_model_id: number
  model_name: string
  brand: Brand
  vehicle_brand_id?: number
}

export interface Brand {
  vehicle_brand_id: number
  brand_name: string
}

export interface MileageHistory {
  mileage_history_id: number
  current_mileage: number
  registration_date: Date
}

export interface Quotation {
  entry_date?: Date
  quotation?: Quotation
  vehicle?: Vehicle
  quotation_id?: number
  vehicle_id: number
  description: string
  quotation_status: QuotationStatus
  total_price: number
  details?: WorkProductDetail[];
  
  // Agrega otras propiedades relevantes si es necesario
}

export interface WorkOrder {
  work_order_id: number
  description: string
  order_status: "finished" | "in_progress" | "not_started"
  vehicle: Vehicle
  order_date: Date
  total_amount: number
  quotation_id?: number
  quotation?: Quotation
  technicians?: Array<WorkOrderTechnician | Person>
  productDetails?: WorkProductDetail[]
}

export interface WorkProductDetail {
  work_product_detail_id?: number
  work_order_id?: number
  work_order?: WorkOrder
  product?: Product
  quotation?: Quotation
  tax?: Tax
  product_id: number
  quotation_id?: number
  tax_id: number
  quantity: number
  sale_price: number
  discount: number
  labor_price: number
}

export interface Product {
  product_id: number
  product_name: string
  profit_margin: number
  last_purchase_price: number
  sale_price: number
  description: string
  product_quantity: number
  type: ProductType
  supplier?: Supplier
  stock: StockProduct
}

export interface Supplier {
  supplier_id: number
  name: string
  adress: string
  city: string
  description: string
  phone: string
}

export interface StockProduct {
  stock_product_id?: number
  product?: Product
  quantity: number
  updated_at?: Date
}

export interface ProductType {
  product_type_id: number
  type_name: string
  category?: ProductCategory
  product_category_id: number
}

export interface ProductCategory {
  product_category_id: number
  category_name: string
}

export interface Tax {
  tax_id: number
  tax_rate: number
}

export interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  className?: string
  placeholder?: string
  hideControls?: boolean
  id?: string
  isPrice?: boolean
  required?: boolean
  disabled?: boolean
}

export interface EmployeeFormProps {
  formData: {
    rut: string
    name: string
    first_surname: string
    second_surname?: string
    email: string
    number_phone: string
    person_type: string
  }
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isEditing?: boolean; // New optional prop
}
export type WorkOrderStatus = "finished" | "in_progress" | "not_started";
export type QuotationStatus = "approved" | "rejected" | "pending";

export interface WorkOrderInput {
  description: string;
  work_order_status?: WorkOrderStatus;
  order_status?: WorkOrderStatus; // Support both field names
  vehicle_id: number;
  quotation_id?: number;
  entry_date?: string;
  total_amount: number;
  order_date?: string;
}

export interface WorkOrderUpdateInput {
  description?: string;
  work_order_status?: WorkOrderStatus;
  order_status?: WorkOrderStatus; // Support both field names  
  total_amount?: number;
}

export interface WorkOrderFormProps {
  initialData?: WorkOrder | null;
  onSuccess: () => void;
  onClose: () => void;
}

export interface WorkOrderListProps {
  workOrders: WorkOrder[];
  onEdit: (workOrder: WorkOrder) => void;
  onDelete: (workOrderId: number) => void;
  loading: boolean;
}

export interface WorkOrderCardProps {
  workOrder: WorkOrder;
  onEdit: (workOrder: WorkOrder) => void;
  onDelete: (workOrderId: number) => void;
}

export interface QuotationInput {
  vehicle_id: number;
  description: string;
  quotation_Status: "approved" | "rejected" | "pending";
  total_price: number;
}

export interface WorkOrderTechnician {
  id?: number;
  workOrder?: WorkOrder;
  technician?: Person;
  status: string;
  assigned_at?: Date;
}

export interface TipoGasto {
  id_tipo_gasto?: number;
  nombre_tipo_gasto: string;
  descripcion?: string;
}

export interface Gasto {
  id_gasto_empresa?: number;
  tipo_gasto: TipoGasto;
  descripcion: string;
  monto: number | string; // Puede venir como string desde el backend
  fecha_gasto: Date | string;
  numero_boleta?: string;
}

export interface PaymentType {
  payment_type_id?: number;
  type_name: string;
}

export interface WorkPayment {
  work_payment_id?: number;
  payment_type: PaymentType;
  payment_type_id?: number; // Para creación/edición
  work_order: WorkOrder;
  work_order_id?: number; // Para creación/edición
  payment_status: string;
  amount_paid: number | string; // Puede venir como string desde el backend
  payment_date: Date | string;
}


