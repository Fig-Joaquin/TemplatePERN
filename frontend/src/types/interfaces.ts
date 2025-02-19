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
}

export interface Vehicle {
  vehicle_id: number
  license_plate: string
  vehicle_status: "running" | "not_running"
  model: model
  mileage_history: mileage_history[]
  color: string
  year: number
  owner: Person | null // Allow owner to be null
  company: company | null // Allow company to be null
}

export interface company {
  company_id: number
  name: string
  email: string
  rut: string
}

export interface model {
  vehicle_model_id: number
  model_name: string
  brand: brand
  vehicle_brand_id?: number
}

export interface brand {
  vehicle_brand_id: number
  brand_name: string
}

export interface mileage_history {
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
  quotation_Status: "approved" | "rejected" | "pending"
  total_price: number
  // Agrega otras propiedades relevantes si es necesario
}

export interface WorkOrder {
  work_order_id: number
  description: string
  work_order_status: "approved" | "rejected" | "pending"
  vehicle: Vehicle
  entry_date: Date
  // Agrega otras propiedades relevantes si es necesario
}

export interface WorkProductDetail {
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
  type: type
  supplier: Supplier
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

export interface type {
  product_type_id: number
  type_name: string
  category?: category
  product_category_id: number
}

export interface category {
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
}

export interface WorkOrder {
    work_order_id: number;
    total_amount: number;
    order_status: "finished" | "in_progress" | "not_started";
    order_date: Date;
    vehicle: Vehicle;
    quotation?: Quotation;
  }
  
  export interface WorkOrderInput {
    vehicle_id: number;
    quotation_id?: number;
    total_amount: number;
    order_status: "finished" | "in_progress" | "not_started";
    order_date?: Date;
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
  

