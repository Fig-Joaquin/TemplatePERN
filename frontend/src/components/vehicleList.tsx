// src/components/vehicleList.tsx
import type { Vehicle, brand } from "../types/interfaces"
import { Car } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface VehicleListProps {
  vehicles: Vehicle[]
  brands?: brand[]
}

const VehicleList = ({ vehicles, brands }: VehicleListProps) => {
  return (
    <div className="space-y-2">
      {vehicles.map((vehicle) => {
        let brandName = "";
        // Si se pasó la lista de marcas (caso Empresas), usar la lógica extendida:
        if (brands && brands.length > 0) {
          brandName = vehicle.model?.brand?.brand_name;
          if (!brandName && vehicle.model) {
            const id = vehicle.model.vehicle_brand_id || (vehicle.model as any).brand_id;
            if (id) {
              const found = brands.find(b => b.vehicle_brand_id === id || (b as any).brand_id === id);
              if (found) {
                brandName = found.brand_name;
              }
            }
          }
        } else {
          // Si no se pasó la prop brands (caso Clientes), usamos la propiedad anidada
          brandName = vehicle.model?.brand?.brand_name;
        }
        brandName = brandName || "Sin marca";
        const modelName = vehicle.model?.model_name || "Sin modelo";
        return (
          <Badge key={vehicle.vehicle_id} variant="outline" className="flex items-center gap-1">
            <Car className="w-3 h-3" />
            {vehicle.license_plate} - {brandName} {modelName} ({vehicle.year})
          </Badge>
        );
      })}
      {vehicles.length === 0 && (
        <span className="text-muted-foreground text-sm">No hay vehículos registrados</span>
      )}
    </div>
  );
};

export default VehicleList;
