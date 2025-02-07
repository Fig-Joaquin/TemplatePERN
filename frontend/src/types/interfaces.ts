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
    model: {
        model_name: string;
        brand: {
            brand_name: string;
        };
    };
    year: number;
    owner: {
        person_id?: number;
        name: string;
        first_surname: string;
    };
}

export interface Quotation {
    quotation_id: number;
    description: string;
    quotation_Status: "approved" | "rejected" | "pending";
    vehicle?: Vehicle;
    // Agrega otras propiedades relevantes si es necesario
}





