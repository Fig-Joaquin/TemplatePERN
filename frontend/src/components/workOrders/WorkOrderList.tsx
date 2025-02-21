import WorkOrderCard from "@/components/workOrders/WorkOrderCard";
import { WorkOrder } from "@/types/interfaces";

interface WorkOrderListProps {
  workOrders: WorkOrder[];
  onEdit: (workOrder: WorkOrder) => void;
  onDelete: (workOrderId: number) => void;
}

const WorkOrderList = ({ workOrders, onEdit, onDelete }: WorkOrderListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workOrders.map((workOrder) => (
        <WorkOrderCard key={workOrder.work_order_id} workOrder={workOrder} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default WorkOrderList;
