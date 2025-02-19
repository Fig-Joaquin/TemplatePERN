import type { Vehicle } from "../types/interfaces"

interface VehicleListProps {
  vehicles: Vehicle[]
}

const VehicleList = ({ vehicles }: VehicleListProps) => {
  return (
    <>
      {vehicles.map((vehicle) => (
        <div key={vehicle.vehicle_id}>
          {vehicle.license_plate} - {vehicle.model.brand.brand_name} {vehicle.model.model_name} ({vehicle.year})
        </div>
      ))}
    </>
  )
}

export default VehicleList

