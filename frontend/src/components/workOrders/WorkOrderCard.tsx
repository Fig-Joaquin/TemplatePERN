import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { formatDate } from "@/utils/formDate";
import { toast } from "react-toastify";
import { deleteWorkOrder } from "@/services/workOrderService";

interface WorkOrderCardProps {
  workOrder: any; // Tipifica según tu interfaz WorkOrder con relaciones necesarias.
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

  // Si existe cotización y ésta trae vehículo, se usa; de lo contrario, se utiliza el vehículo de la orden.
  const displayVehicle =
    quotation && quotation.vehicle ? quotation.vehicle : vehicle;

  // Si existe cotización y trae detalles, se usan; de lo contrario, se toman los detalles directos.
  const detailsToShow =
    quotation && quotation.productDetails && quotation.productDetails.length > 0
      ? quotation.productDetails
      : productDetails;

  // Calcular el total a partir de los detalles de productos
  const computedTotal =
    detailsToShow?.reduce((acc: number, detail: any) => {
      const subtotal =
        Number(detail.sale_price) * Number(detail.quantity) +
        Number(detail.labor_price);
      return acc + subtotal;
    }, 0) || 0;

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

  // Función auxiliar para renderizar la información del dueño o de la empresa.
  // Si existe un dueño, muestra: "Nombre PrimerApellido - Teléfono: <número>".
  // Si no, muestra: "NombreEmpresa - Teléfono: <número>" (o "Sin teléfono" si no existe).
  const renderOwnerOrCompany = () => {
    if (displayVehicle?.owner) {
      const { name, first_surname, number_phone } = displayVehicle.owner;
      return `${name} ${first_surname} - Teléfono: ${number_phone || "Sin teléfono"}`;
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

      {/* Diálogo principal de la orden */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles de la Orden #{work_order_id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
              {detailsToShow && detailsToShow.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-4 py-2 text-left">
                          Producto
                        </th>
                        <th className="border px-4 py-2 text-right">
                          Cantidad
                        </th>
                        <th className="border px-4 py-2 text-right">
                          Precio Unitario
                        </th>
                        <th className="border px-4 py-2 text-right">
                          Mano de Obra
                        </th>
                        <th className="border px-4 py-2 text-right">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailsToShow.map((detail: any, idx: number) => {
                        const subtotal =
                          Number(detail.sale_price) *
                          Number(detail.quantity) +
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
                              {formatPriceCLP(subtotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-200">
                        <td
                          className="border px-4 py-2 font-bold"
                          colSpan={4}
                        >
                          Total Orden:
                        </td>
                        <td className="border px-4 py-2 text-right font-bold">
                          {formatPriceCLP(computedTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p>No hay productos asociados</p>
              )}
            </div>
          </div>
          {/* Botones de acciones */}
          <div className="mt-4 flex justify-end space-x-2">
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
        <DialogContent>
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
            <Button
              variant="destructive"
              onClick={() => setConfirmDelete(false)}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorkOrderCard;
