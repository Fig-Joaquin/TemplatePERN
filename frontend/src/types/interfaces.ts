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
    model_id: number;
    model_name: string;
    brand: brand;
}

export interface brand {
    brand_id: number;
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





