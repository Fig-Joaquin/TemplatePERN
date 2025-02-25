"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { formatDate } from "@/utils/formDate";
import { toast } from "react-toastify";
import { deleteWorkOrder } from "@/services/workOrderService";
import { getWorkProductDetailsByQuotationId } from "@/services/workProductDetail";
import { getTaxById } from "@/services/taxService";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkOrderCardProps {
  workOrder: any; // Ajusta según tu interfaz WorkOrder con las relaciones necesarias.
  onDelete?: (id: number) => void;
}

const statusTranslations: Record<string, string> = {
  finished: "Finalizado",
  in_progress: "En Progreso",
  not_started: "No Iniciado",
};

const statusColors: Record<string, string> = {
  finished: "text-green-600",
  in_progress: "text-blue-600",
  not_started: "text-red-600",
};

const WorkOrderCard = ({ workOrder, onDelete }: WorkOrderCardProps) => {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loadedDetails, setLoadedDetails] = useState<any[]>([]);
  const [taxRate, setTaxRate] = useState<number>(0);
  const navigate = useNavigate();

  const {
    work_order_id,
    total_amount,
    order_status,
    order_date,
    description,
    vehicle,
    quotation,
    productDetails, // Detalles de productos asociados directamente a la orden
  } = workOrder;

  // Si existe cotización y ésta trae vehículo, se utiliza; de lo contrario, se usa el de la orden.
  const displayVehicle =
    quotation && quotation.vehicle ? quotation.vehicle : vehicle;

  // Estado inicial: si quotation.productDetails existe y tiene elementos, se usa; de lo contrario se usa productDetails.
  const initialDetails =
    quotation && quotation.productDetails && quotation.productDetails.length > 0
      ? quotation.productDetails
      : productDetails && productDetails.length > 0
        ? productDetails
        : [];

  // Cargar detalles adicionales si la cotización existe pero no trae detalles
  useEffect(() => {
    if (quotation && (!quotation.productDetails || quotation.productDetails.length === 0)) {
      getWorkProductDetailsByQuotationId(quotation.quotation_id)
        .then((res) => setLoadedDetails(res))
        .catch((err) => {
          console.error("Error al cargar detalles por cotización:", err);
          toast.error("Error al cargar detalles de productos");
        });
    } else {
      setLoadedDetails(initialDetails);
    }
  }, [quotation, productDetails, initialDetails]);

  // Cargar tax rate (IVA)
  useEffect(() => {
    const fetchTax = async () => {
      try {
        const res = await getTaxById(1);
        setTaxRate(res.tax_rate / 100);
      } catch (error) {
        toast.error("Error al cargar el impuesto");
      }
    };
    fetchTax();
  }, []);

  // Calcular el subtotal a partir de los detalles cargados
  const subtotal =
    loadedDetails.reduce((acc: number, detail: any) => {
      const sub = Number(detail.sale_price) * Number(detail.quantity) + Number(detail.labor_price);
      return acc + sub;
    }, 0) || 0;
  const taxAmount = subtotal * taxRate;
  const finalTotal = subtotal + taxAmount;

  const handleEdit = () => {
    navigate(`/admin/orden-trabajo/editar/${work_order_id}`);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await deleteWorkOrder(work_order_id);
      toast.success("Orden eliminada correctamente");
      if (onDelete) onDelete(work_order_id);
      setConfirmDelete(false);
      setOpen(false);
    } catch (error) {
      console.error("Error al eliminar la orden:", error);
      toast.error("Error al eliminar la orden");
    }
  };

  // Renderiza la información del dueño o empresa según corresponda.
  const renderOwnerOrCompany = () => {
    if (displayVehicle?.owner) {
      const { name, first_surname, number_phone } = displayVehicle.owner;
      return `${name} ${first_surname} - Teléfono: +${number_phone || "Sin teléfono"}`;
    } else if (displayVehicle?.company) {
      const { name, phone } = displayVehicle.company;
      return `${name} - Teléfono: ${phone || "Sin teléfono"}`;
    }
    return "No especificado";
  };

  return (
    <>
      <Card
        onClick={() => setOpen(true)}
        className="cursor-pointer hover:shadow-lg"
      >
        <CardHeader>
          <CardTitle>Orden #{work_order_id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Status:</strong>{" "}
            <span className={statusColors[order_status]}>
              {statusTranslations[order_status] || "Desconocido"}
            </span>
          </p>
          <p>
            <strong>Total:</strong> {formatPriceCLP(total_amount)}
          </p>
          <p>
            <strong>Fecha:</strong> {formatDate(order_date)}
          </p>
          <p>
            <strong>Vehículo:</strong>{" "}
            {displayVehicle?.license_plate || "No especificado"} -{" "}
            {displayVehicle?.model?.brand?.brand_name || "No especificado"}{" "}
            {displayVehicle?.model?.model_name || "No especificado"}
          </p>
          <p>
            <strong>{displayVehicle?.owner ? "Dueño:" : "Empresa:"}</strong>{" "}
            {renderOwnerOrCompany()}
          </p>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card text-card-foreground max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Orden #{work_order_id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            {/* Información de la Orden */}
            <div>
              <h3 className="font-bold mb-1">Información de la Orden</h3>
              <p>
                <strong>Status:</strong>{" "}
                <span className={statusColors[order_status]}>
                  {statusTranslations[order_status] || "Desconocido"}
                </span>
              </p>
              <p>
                <strong>Total:</strong> {formatPriceCLP(total_amount)}
              </p>
              <p>
                <strong>Fecha:</strong> {formatDate(order_date)}
              </p>
              <p>
                <strong>Descripción:</strong>{" "}
                {description || "No especificada"}
              </p>
            </div>

            {/* Información del Vehículo */}
            <div>
              <h3 className="font-bold mb-1">Información del Vehículo</h3>
              <p>
                <strong>Matrícula:</strong>{" "}
                {displayVehicle?.license_plate || "No especificado"}
              </p>
              <p>
                <strong>Modelo:</strong>{" "}
                {displayVehicle?.model?.model_name || "No especificado"}
              </p>
              <p>
                <strong>Marca:</strong>{" "}
                {displayVehicle?.model?.brand?.brand_name || "No especificado"}
              </p>
              <p>
                <strong>
                  {displayVehicle?.owner ? "Dueño:" : "Empresa:"}
                </strong>{" "}
                {renderOwnerOrCompany()}
              </p>
            </div>

            {/* Detalles de Productos */}
            <div>
              <h3 className="font-bold mb-1">Detalles de Productos</h3>
              {loadedDetails && loadedDetails.length > 0 ? (
                <ScrollArea className="h-[300px] overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-4 py-2 text-left">Producto</th>
                        <th className="border px-4 py-2 text-right">Cantidad</th>
                        <th className="border px-4 py-2 text-right">Precio Unitario</th>
                        <th className="border px-4 py-2 text-right">Mano de Obra</th>
                        <th className="border px-4 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadedDetails.map((detail, idx: number) => {
                        const subtotalDetail =
                          Number(detail.sale_price) * Number(detail.quantity) +
                          Number(detail.labor_price);
                        return (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="border px-4 py-2">
                              {detail.product?.product_name || "N/A"}
                            </td>
                            <td className="border px-4 py-2 text-right">
                              {detail.quantity}
                            </td>
                            <td className="border px-4 py-2 text-right">
                              {formatPriceCLP(Number(detail.sale_price))}
                            </td>
                            <td className="border px-4 py-2 text-right">
                              {formatPriceCLP(Number(detail.labor_price))}
                            </td>
                            <td className="border px-4 py-2 text-right">
                              {formatPriceCLP(subtotalDetail)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-200">
                        <td className="border px-4 py-2 font-bold" colSpan={4}>
                          Subtotal:
                        </td>
                        <td className="border px-4 py-2 text-right font-bold">
                          {formatPriceCLP(subtotal)}
                        </td>
                      </tr>
                      <tr className="bg-gray-200">
                        <td className="border px-4 py-2 font-bold" colSpan={4}>
                          IVA ({(taxRate * 100).toFixed(0)}%):
                        </td>
                        <td className="border px-4 py-2 text-right font-bold">
                          {formatPriceCLP(taxAmount)}
                        </td>
                      </tr>
                      <tr className="bg-gray-200">
                        <td className="border px-4 py-2 font-bold" colSpan={4}>
                          Total Final:
                        </td>
                        <td className="border px-4 py-2 text-right font-bold">
                          {formatPriceCLP(finalTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </ScrollArea>
              ) : (
                <p>No hay productos asociados</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2 border-t pt-4">
            <Button variant="outline" onClick={handleEdit}>
              Editar
            </Button>
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              Eliminar
            </Button>
            <Button onClick={() => setOpen(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="bg-card text-card-foreground max-w-4xl">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <p className="mb-4">
            ¿Estás seguro de eliminar la orden #{work_order_id}?
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleDeleteConfirmed}>
              Eliminar
            </Button>
            <Button variant="destructive" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorkOrderCard;
