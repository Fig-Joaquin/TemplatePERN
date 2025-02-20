import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { createWorkOrder, updateWorkOrder } from "@/services/workOrderService";
import type { WorkOrder } from "@/types/interfaces";

interface WorkOrderFormProps {
  initialData?: WorkOrder | null;
  onSuccess: () => void;
  onClose: () => void;
}

const WorkOrderForm = ({ initialData, onSuccess, onClose }: WorkOrderFormProps) => {
  const [orderStatus, setOrderStatus] = useState<"approved" | "rejected" | "pending">(initialData?.work_order_status || "pending");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (initialData) {
        await updateWorkOrder(initialData.work_order_id, { work_order_status: orderStatus });
        toast.success("Orden actualizada");
      } else {
        await createWorkOrder({ work_order_status: orderStatus });
        toast.success("Orden creada");
      }
      onSuccess();
      onClose();
    } catch {
      toast.error("Error al guardar la orden");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        Estado de la Orden:
        <select
          className="border rounded p-2 w-full"
          value={orderStatus}
          onChange={(e) => setOrderStatus(e.target.value)}
        >
          <option value="pending">Pendiente</option>
          <option value="approved">Aprobada</option>
          <option value="rejected">Rechazada</option>
        </select>
      </label>
      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
};

export default WorkOrderForm;
