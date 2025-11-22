import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { createWorkOrder } from "@/services/workOrderService";
import type { WorkOrder, WorkOrderInput, WorkProductDetail, Quotation } from "@/types/interfaces";
import { fetchQuotationById } from "@/services/quotationService";
import { createWorkProductDetail } from "@/services/workProductDetail";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WorkOrderFormProps {
  initialData?: WorkOrder | null;
  quotationId?: number;
  onSuccess: () => void;
  onClose: () => void;
}

const WorkOrderForm = ({ initialData, quotationId, onSuccess, onClose }: WorkOrderFormProps) => {
  const [description, setDescription] = useState(initialData?.description || "");
  const [products, setProducts] = useState<WorkProductDetail[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (quotationId) {
      loadQuotationDetails(quotationId);
    }
  }, [quotationId]);

  const loadQuotationDetails = async (quotationId: number) => {
    try {
      const quotation: Quotation = await fetchQuotationById(quotationId);
      setDescription(quotation.description);
      setProducts(quotation.details || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Error al cargar detalles de la cotización");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newWorkOrder: WorkOrderInput = {
        description,
        work_order_status: "not_started",
        vehicle_id: initialData?.vehicle.vehicle_id || 1, // Se debe obtener dinámicamente
        quotation_id: quotationId,
        total_amount: products.reduce((total, p) => total + p.sale_price * p.quantity + p.labor_price, 0),
      };

      const createdOrder = await createWorkOrder(newWorkOrder);

      if (!quotationId) {
        await Promise.all(products.map((detail) => createWorkProductDetail({
          work_order_id: createdOrder.work_order_id,
          product_id: detail.product_id,
          quantity: detail.quantity,
          sale_price: detail.sale_price,
          labor_price: detail.labor_price,
          tax_id: detail.tax_id,
          discount: detail.discount,
        })));
      }

      toast.success("Orden de trabajo creada exitosamente");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la orden de trabajo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Guardar Orden"}
      </Button>
    </form>
  );
};

export default WorkOrderForm;
