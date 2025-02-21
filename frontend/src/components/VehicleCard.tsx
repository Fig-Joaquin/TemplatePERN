import type { Quotation } from "../types/interfaces"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Car } from "lucide-react"
import { formatQuantity } from "@/utils/formatQuantity"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface VehicleCardProps {
  vehicle: Quotation["vehicle"]
  onEdit?: () => void
  onDelete?: () => void
  showActions?: boolean
}

export const VehicleCard = ({ vehicle, onEdit, onDelete, showActions = false }: VehicleCardProps) => {
  if (!vehicle) return null

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="bg-primary/10">
        <CardTitle className="flex items-center gap-2">
          <Car className="w-5 h-5" />
          {vehicle.license_plate}
          <Badge variant="secondary">
            {vehicle.model.brand.brand_name} {vehicle.model.model_name}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-2">
        <p className="text-sm">
          <span className="font-medium">Año:</span> {vehicle.year}
        </p>
        <p className="text-sm">
          <span className="font-medium">Color:</span> {vehicle.color}
        </p>
        <p className="text-sm">
          <span className="font-medium">Estado:</span>{" "}
          <Badge variant={vehicle.vehicle_status === "running" ? "secondary" : "destructive"}>
            {vehicle.vehicle_status === "running" ? "Funcionando" : "Averiado"}
          </Badge>
        </p>
        <p className="text-sm">
          <span className="font-medium">Propietario:</span>
          {vehicle.owner
            ? ` ${vehicle.owner.name} ${vehicle.owner.first_surname}`
            : ` Empresa: ${vehicle.company?.name}`}
        </p>
        <p className="text-sm">
          <span className="font-medium">Kilometraje actual:</span>{" "}
          {vehicle.mileage_history && vehicle.mileage_history.length > 0
            ? formatQuantity(vehicle.mileage_history[vehicle.mileage_history.length - 1].current_mileage) + " km"
            : "N/A"}
        </p>
      </CardContent>
      {showActions && (
        <CardFooter className="flex justify-end space-x-2 bg-muted/50">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

