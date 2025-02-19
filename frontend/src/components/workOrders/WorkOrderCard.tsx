
import { WorkOrder } from "@/types/interfaces";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface WorkOrderCardProps {
  workOrder: WorkOrder;
  onEdit: (workOrder: WorkOrder) => void;
  onDelete: (workOrderId: number) => void;
}

const statusLabels: Record<WorkOrder["order_status"], string> = {
  not_started: "No Iniciada",
  in_progress: "En Progreso",
  finished: "Finalizada",
};

const WorkOrderCard = ({ workOrder, onEdit, onDelete }: WorkOrderCardProps) => {
  return (
    <Card className="shadow-md hover:shadow-lg transition-all">
      <CardHeader>
        <CardTitle className="text-lg font-bold">{workOrder.vehicle.license_plate}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p>
          <strong>Estado:</strong>{" "}
          <span
            className={`px-2 py-1 rounded text-white ${workOrder.order_status === "finished"
                ? "bg-green-500"
                : workOrder.order_status === "in_progress"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
          >
            {statusLabels[workOrder.order_status]}
          </span>
        </p>
        <p>
          <strong>Fecha de Creación:</strong> {format(new Date(workOrder.order_date), "dd/MM/yyyy")}
        </p>
        {workOrder.quotation && (
          <p>
            <strong>Cotización:</strong> #{workOrder.quotation.quotation_id}
          </p>
        )}
        <p>
          <strong>Monto Total:</strong> ${workOrder.total_amount.toLocaleString()}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(workOrder)}>
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(workOrder.work_order_id)}>
          <Trash2 className="w-4 h-4 mr-2" />
          Eliminar
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WorkOrderCard;
