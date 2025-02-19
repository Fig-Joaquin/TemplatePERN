import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import WorkOrderList from "@/components/workOrders/WorkOrderList";
import WorkOrderForm from "@/components/workOrders/WorkOrderForm";
import { getAllWorkOrders, deleteWorkOrder } from "@/services/workOrderService";
import { WorkOrder } from "@/types/interfaces";
import { toast } from "react-toastify";

const WorkOrdersPage = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const loadWorkOrders = async () => {
    setLoading(true);
    try {
      const data = await getAllWorkOrders();
      setWorkOrders(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedWorkOrder(null);
    setModalOpen(true);
  };

  const handleDelete = async (workOrderId: number) => {
    try {
      await deleteWorkOrder(workOrderId);
      setWorkOrders(workOrders.filter((wo) => wo.work_order_id !== workOrderId));
      toast.success("Orden eliminada correctamente");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredWorkOrders = workOrders.filter((wo) =>
    wo.vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Órdenes de Trabajo</h1>
        <div className="relative w-72">
          <Input
            type="text"
            placeholder="Buscar por matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 w-4 h-4" />
          Nueva Orden
        </Button>
      </div>

      <WorkOrderList workOrders={filteredWorkOrders} onEdit={openEditModal} onDelete={handleDelete} loading={loading} />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedWorkOrder ? "Editar Orden" : "Nueva Orden"}</DialogTitle>
          </DialogHeader>
          <WorkOrderForm
            initialData={selectedWorkOrder}
            onSuccess={loadWorkOrders}
            onClose={() => setModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkOrdersPage;
