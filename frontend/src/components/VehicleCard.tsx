import { Car, Edit, Trash2, FileText, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Vehicle } from "../types/interfaces"
import { useNavigate } from "react-router-dom"

interface VehicleCardProps {
  vehicle: Vehicle
  onEdit?: () => void
  onDelete?: () => void
  showActions?: boolean
}

export function VehicleCard({ vehicle, onEdit, onDelete, showActions = false }: VehicleCardProps) {
  const navigate = useNavigate()

  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="flex-1 p-6">
        <div className="mb-4 flex justify-between items-center">
          <Badge variant="outline" className="text-lg font-semibold px-3 py-1 flex items-center gap-2">
            <Car className="w-4 h-4" />
            {vehicle.license_plate}
          </Badge>
          <Badge variant={vehicle.vehicle_status === "running" ? "secondary" : "destructive"}>
            {vehicle.vehicle_status === "running" ? "Funcionando" : "Averiado"}
          </Badge>
        </div>

        <div className="space-y-2">
          <p className="font-medium">
            {vehicle.model?.brand?.brand_name} {vehicle.model?.model_name}
          </p>
          <p className="text-sm text-muted-foreground">
            {vehicle.owner
              ? `Dueño: ${vehicle.owner.name} ${vehicle.owner.first_surname || ""}`
              : vehicle.company
              ? `Empresa: ${vehicle.company.name}`
              : "Sin propietario"}
          </p>
          <div className="flex gap-2 flex-wrap">
            {vehicle.year && <Badge variant="outline">Año: {vehicle.year}</Badge>}
            {vehicle.color && <Badge variant="outline">Color: {vehicle.color}</Badge>}
          </div>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="border-t p-4 bg-muted/5 flex-wrap gap-2">
          <div className="flex gap-2 flex-wrap w-full">
            <Button variant="default" size="sm" onClick={onEdit} className="flex-1">
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={onDelete} className="flex-1">
              <Trash2 className="w-4 h-4 mr-1" />
              Eliminar
            </Button>

            {/* Nuevos botones para crear cotización y orden de trabajo */}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              style={{ 
                backgroundColor: 'var(--stat-blue-bg)', 
                color: 'var(--stat-blue-text)',
                borderColor: 'var(--balance-net-border)'
              }}
              onClick={() => navigate(`/admin/cotizaciones/nuevo?vehicleId=${vehicle.vehicle_id}`)}
            >
              <FileText className="w-4 h-4 mr-1" />
              Crear Cotización
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-1"
              style={{ 
                backgroundColor: 'var(--stat-green-bg)', 
                color: 'var(--stat-green-text)',
                borderColor: 'var(--balance-income-border)'
              }}
              onClick={() => navigate(`/admin/nueva-orden-trabajo?vehicleId=${vehicle.vehicle_id}&withoutQuotation=true`)}
            >
              <Wrench className="w-4 h-4 mr-1" />
              Crear Orden de Trabajo
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

