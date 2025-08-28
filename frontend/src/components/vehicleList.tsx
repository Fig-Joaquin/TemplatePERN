// src/components/vehicleList.tsx
import type { Vehicle, Brand } from "../types/interfaces"
import { Car, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

interface VehicleListProps {
  vehicles: Vehicle[]
  brands?: Brand[]
  personId?: number // ID de la persona para crear vehículo asociado
  companyId?: number // ID de la empresa para crear vehículo asociado
}

const VehicleList = ({ vehicles, brands, personId, companyId }: VehicleListProps) => {
  const navigate = useNavigate()

  const handleAddVehicle = () => {
    if (personId) {
      navigate(`/admin/vehiculos/nuevo?person_id=${personId}`)
    } else if (companyId) {
      navigate(`/admin/vehiculos/nuevo?company_id=${companyId}`)
    }
  }

  return (
    <div className="space-y-2">
      {vehicles.map((vehicle) => {
        let brandName = "";
        // Si se pasó la lista de marcas (caso Empresas), usar la lógica extendida:
        if (brands && brands.length > 0) {
          brandName = vehicle.model?.brand?.brand_name || "";
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
          brandName = vehicle.model?.brand?.brand_name || "";
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
        <div className="flex flex-col items-start gap-2">
          <span className="text-muted-foreground text-sm">No hay vehículos registrados</span>
          {(personId || companyId) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddVehicle}
              className="h-8 px-3 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Agregar vehículo
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default VehicleList;
