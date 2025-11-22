"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { formatDate } from "@/utils/formDate";
import { toast } from "react-toastify";
import { deleteWorkOrder } from "@/services/workOrderService";
import { getWorkProductDetailsByQuotationId } from "@/services/workProductDetail";
import { getTaxById } from "@/services/taxService";
import { getWorkOrderTechnicians } from "@/services/workOrderTechnicianService";
import { MoreHorizontal, Edit, UserPlus, Trash2 } from "lucide-react";

interface WorkOrderCardProps {
  workOrder: any; // Ajusta según tu interfaz WorkOrder con las relaciones necesarias.
  onDelete?: (id: number) => void;
  onCreateDebtor?: (workOrder: any) => void;
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

const WorkOrderCard = ({ workOrder, onDelete, onCreateDebtor }: WorkOrderCardProps) => {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loadedDetails, setLoadedDetails] = useState<any[]>([]);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [assignedTechnicians, setAssignedTechnicians] = useState<any[]>([]);
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
        .catch((err: any) => {
          console.error("Error al cargar detalles por cotización:", err);
          toast.error(err.response?.data?.message || err.message || "Error al cargar detalles de productos");
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
      } catch (error: any) {
        toast.error(error.response?.data?.message || error.message || "Error al cargar el impuesto");
      }
    };
    fetchTax();
  }, []);

  // Fetch assigned technicians
  useEffect(() => {
    const fetchAssignedTechnicians = async () => {
      try {
        const techs = await getWorkOrderTechnicians(work_order_id);
        setAssignedTechnicians(techs);
      } catch (error) {
        console.error("Error loading assigned technicians:", error);
      }
    };
    fetchAssignedTechnicians();
  }, [work_order_id]);

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

  const handleCreateDebtor = () => {
    if (onCreateDebtor) {
      onCreateDebtor(workOrder);
    }
    setOpen(false); // Cerrar el modal después de crear el deudor
  };

  const handleDeleteConfirmed = async () => {
    try {
      await deleteWorkOrder(work_order_id);
      toast.success("Orden eliminada correctamente");
      if (onDelete) onDelete(work_order_id);
      setConfirmDelete(false);
      setOpen(false);
    } catch (error: any) {
      console.error("Error al eliminar la orden:", error);
      toast.error(error.response?.data?.message || error.message || "Error al eliminar la orden");
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
          {assignedTechnicians.length > 0 && (
            <p className="mt-2">
              <strong>Mécanico:</strong>{" "}
              {assignedTechnicians.map(tech => {
                if (!tech || !tech.technician) return "Mécanico sin datos";
                return `${tech.technician.name || "Sin nombre"} ${tech.technician.first_surname || ""}`;
              }).join(', ')}
            </p>
          )}
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

            {/* Assigned Technicians */}
            <div>
              <h3 className="font-bold mb-1">Mécanico Asignados</h3>
              {assignedTechnicians.length > 0 ? (
                <ul className="list-disc list-inside">
                  {assignedTechnicians.map(tech => (
                    <li key={tech.id} className="flex flex-col">
                      <span>
                        {!tech || !tech.technician
                          ? "Mécanico sin datos"
                          : `${tech.technician.name || "Sin nombre"} ${tech.technician.first_surname || ""}`
                        }
                      </span>
                      {tech.assigned_at && (
                        <span className="text-xs text-muted-foreground ml-2">
                          Asignado: {new Date(tech.assigned_at).toLocaleDateString('es-CL', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No hay Mécanico asignados.</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end items-center border-t pt-4">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="hover:bg-gray-50 focus:bg-gray-50">
                    <MoreHorizontal className="mr-2 h-4 w-4" />
                    Acciones
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleEdit}
                    className="cursor-pointer hover:bg-green-50 focus:bg-green-50"
                  >
                    <Edit className="mr-2 h-4 w-4 text-green-600" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleCreateDebtor}
                    className="cursor-pointer hover:bg-orange-50 focus:bg-orange-50"
                  >
                    <UserPlus className="mr-2 h-4 w-4 text-orange-600" />
                    Crear Deudor
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setConfirmDelete(true)}
                    className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => setOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">¡Advertencia! Eliminación Permanente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center font-medium text-foreground">
              ¿Estás seguro de eliminar la orden #{work_order_id}?
            </p>
            <div className="bg-muted border border-border rounded-md p-3 text-sm">
              <p className="text-foreground"><strong>Orden:</strong> #{work_order_id}</p>
              <p className="text-foreground"><strong>Estado:</strong> {statusTranslations[order_status] || order_status}</p>
              <p className="text-foreground"><strong>Monto:</strong> {formatPriceCLP(finalTotal)}</p>
            </div>
            <div className="bg-accent/10 border border-accent/20 rounded-md p-3 text-sm">
              <p className="text-foreground"><strong>ATENCIÓN:</strong> Esta acción realizará lo siguiente:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-foreground">
                <li>Eliminará la orden de trabajo permanentemente</li>
                <li>Restaurará el stock de productos utilizados</li>
                <li>Eliminará todos los pagos asociados</li>
              </ul>
              <p className="mt-2 font-semibold text-foreground">Esta acción no se puede deshacer.</p>
            </div>
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirmed}>
              Eliminar permanentemente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorkOrderCard;
