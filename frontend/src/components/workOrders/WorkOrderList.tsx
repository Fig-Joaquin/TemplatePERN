import WorkOrderCard from "./WorkOrderCard";
import { WorkOrder } from "@/types/interfaces";

interface WorkOrderListProps {
  workOrders: WorkOrder[];
  onEdit: (workOrder: WorkOrder) => void;
  onDelete: (workOrderId: number) => void;
  loading: boolean;
}

const WorkOrderList = ({ workOrders, onEdit, onDelete, loading }: WorkOrderListProps) => {
  if (loading) return <p>Cargando órdenes de trabajo...</p>;
  if (workOrders.length === 0) return <p>No hay órdenes de trabajo registradas.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workOrders.map((wo) => (
        <WorkOrderCard key={wo.work_order_id} workOrder={wo} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default WorkOrderList;
