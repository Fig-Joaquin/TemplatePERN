import type { Vehicle } from "../types/interfaces"
import { Car } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface VehicleListProps {
  vehicles: Vehicle[]
}

const VehicleList = ({ vehicles }: VehicleListProps) => {
  return (
    <div className="space-y-2">
      {vehicles.map((vehicle) => (
        <Badge key={vehicle.vehicle_id} variant="outline" className="flex items-center gap-1">
          <Car className="w-3 h-3" />
          {vehicle.license_plate} - {vehicle.model.brand.brand_name} {vehicle.model.model_name} ({vehicle.year})
        </Badge>
      ))}
      {vehicles.length === 0 && <span className="text-muted-foreground text-sm">No hay vehículos registrados</span>}
    </div>
  )
}

export default VehicleList

