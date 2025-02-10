export interface Person {
    person_id: number;
    name: string;
    first_surname: string;
    second_surname?: string;
    email: string;
    number_phone: string;
    person_type: string;
    rut: string;
}

export interface ClientFormProps {
    formData: {
        name: string;
        first_surname: string;
        second_surname?: string;
        email: string;
        number_phone: string;
        person_type: string;
        rut: string;
    };
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

export interface Vehicle {
    vehicle_id: number;
    license_plate: string;
    vehicle_status: "running" | "not_running";
    model: model;
    mileage_history: mileage_history[];
    color: string;
    year: number;
    owner: Person;
}

export interface model {
    vehicle_model_id: number;
    model_name: string;
    brand: brand;
}

export interface brand {
    vehicle_brand_id: number;
    brand_name: string;
}

export interface mileage_history {
    mileage_history_id: number;
    current_mileage: number;
    registration_date: Date;
}

export interface Quotation {
    quotation_id: number;
    description: string;
    quotation_Status: "approved" | "rejected" | "pending";
    vehicle?: Vehicle;
    entry_date: Date;
    // Agrega otras propiedades relevantes si es necesario
}

export interface WorkOrder {
    work_order_id: number;
    description: string;
    work_order_status: "approved" | "rejected" | "pending";
    vehicle: Vehicle;
    entry_date: Date;
    // Agrega otras propiedades relevantes si es necesario
}

export interface WorkProductDetail {
    work_product_detail_id: number;
    work_order: WorkOrder;
    product: Product;
    quotation: Quotation;
    tax: Tax;
    quantity: number;
    sale_price: number;
    discount: number;
    labor_price: number;
}

export interface Product {
    product_id: number;
    product_name: string;
    profit_margin: string;
    last_purchase_price: string;
    sale_price: string;
    description: string;
    product_quantity: number;
    type: type;
}

export interface type {
    product_type_id: number;
    type_name: string;
    category: category;
}

export interface category {
    product_category_id: number;
    category_name: string;
}

export interface Tax {
    tax_id: number;
    tax_name: string;
    tax_percentage: number;
}





