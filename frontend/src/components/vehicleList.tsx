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

interface VehicleListProps {
    vehicles: Vehicle[];
}

const VehicleList = ({ vehicles }: VehicleListProps) => {
    return (
        <>
            {vehicles.map(vehicle => (
                <div key={vehicle.vehicle_id}>
                    {vehicle.license_plate} - {vehicle.model.brand.brand_name} {vehicle.model.model_name} ({vehicle.year})
                </div>
            ))}
        </>
    );
};

export default VehicleList;