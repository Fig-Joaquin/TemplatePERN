import type { Quotation } from "../types/interfaces"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"

interface VehicleCardProps {
    vehicle: Quotation["vehicle"]
    onEdit?: () => void
    onDelete?: () => void
    showActions?: boolean
}

export const VehicleCard = ({ vehicle, onEdit, onDelete, showActions = false }: VehicleCardProps) => {
    return (
        <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="border-b p-4">
                <h3 className="font-bold text-lg">{vehicle?.license_plate}</h3>
                <p className="text-sm text-gray-500">
                    {vehicle?.model.brand.brand_name} {vehicle?.model.model_name}
                </p>
            </div>
            <div className="p-4 space-y-2">
                <p>
                    <strong>Año:</strong> {vehicle?.year}
                </p>
                <p>
                    <strong>Color:</strong> {vehicle?.color}
                </p>
                <p>
                    <strong>Estado:</strong> {vehicle?.vehicle_status}
                </p>
                <p>
                    <strong>Propietario:</strong>
                    {vehicle?.owner
                        ? `${vehicle.owner.name} ${vehicle.owner.first_surname}`
                        : `Empresa: ${vehicle?.company?.name}`}
                </p>
                <p>
                    <strong>Kilometraje actual:</strong>{" "}
                    {vehicle?.mileage_history && vehicle.mileage_history.length > 0 ? 
                        vehicle.mileage_history[vehicle.mileage_history.length - 1].current_mileage + " km" : "N/A"}
                </p>
            </div>
            {showActions && (
                <div className="p-4 flex justify-end space-x-2">
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
                </div>
            )}
        </div>
    )
}

