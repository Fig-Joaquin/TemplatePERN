"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { CreditCard, Save, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { NumberInput } from "@/components/numberInput";
import {
  fetchWorkPaymentById,
  createWorkPayment,
  updateWorkPayment
} from "@/services/work/workPayment";
import { fetchPaymentTypes } from "@/services/work/paymentType";
import { fetchWorkOrders } from "@/services/workOrderService";
import type { PaymentType, WorkOrder, WorkPayment } from "@/types/interfaces";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { formatDateForInput } from "@/utils/formatDateForInput";
import { usePaymentContext } from "@/contexts/PaymentContext";

export default function WorkPaymentFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { refreshPayments } = usePaymentContext();

  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<{
    payment_type_id: string;
    work_order_id: string;
    payment_status: string;
    amount_paid: number;
    payment_date: string;
  }>({
    payment_type_id: "",
    work_order_id: "",
    payment_status: "pendiente",
    amount_paid: 0,
    payment_date: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
  });

  // Añade este estado para el término de búsqueda
  const [searchTerm, setSearchTerm] = useState("");

  // Añade este estado para controlar la apertura del selector
  const [, setIsWorkOrderSelectOpen] = useState(false);

  // Añade este estado para almacenar el monto total de la orden seleccionada
  const [selectedOrderTotal, setSelectedOrderTotal] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Cargar tipos de pago
        const typesData = await fetchPaymentTypes();
        setPaymentTypes(typesData);

        // Cargar órdenes de trabajo
        const ordersData = await fetchWorkOrders();
        setWorkOrders(ordersData);

        // Si estamos en modo edición, cargar los datos del pago
        if (isEditMode) {
          const paymentData = await fetchWorkPaymentById(parseInt(id));
          setFormData({
            payment_type_id: paymentData.payment_type.payment_type_id!.toString(),
            work_order_id: paymentData.work_order.work_order_id!.toString(),
            payment_status: paymentData.payment_status,
            amount_paid: Number(paymentData.amount_paid),
            payment_date: formatDateForInput(new Date(paymentData.payment_date)),
          });

          // Actualizar el monto total de la orden seleccionada
          const orderTotal = Number(paymentData.work_order.total_amount) || 0;
          setSelectedOrderTotal(orderTotal);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast.error("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Actualiza esta función para establecer el monto total al seleccionar una orden
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Si es la orden de trabajo la que cambia, actualizar el monto total
    if (name === "work_order_id") {
      const selectedOrder = workOrders.find(order => order.work_order_id?.toString() === value);
      if (selectedOrder) {
        const orderTotal = Number(selectedOrder.total_amount) || 0;
        setSelectedOrderTotal(orderTotal);

        // Actualizar automáticamente el estado según el monto pagado
        updatePaymentStatus(formData.amount_paid, orderTotal);
      }
    }
  };

  // Modifica la función updatePaymentStatus para aceptar un parámetro que permita forzar la actualización
  const updatePaymentStatus = (amountPaid: number, total: number = selectedOrderTotal, forceUpdate: boolean = false) => {
    if (total <= 0) return; // Evitar división por cero o valores negativos

    let newStatus = formData.payment_status;

    if (amountPaid <= 0) {
      newStatus = "pendiente";
    } else if (amountPaid >= total) {
      newStatus = "pagado";
    } else {
      newStatus = "parcial";
    }

    // Actualizar si no está cancelado o si estamos forzando la actualización
    if (formData.payment_status !== "cancelado" || forceUpdate) {
      setFormData(prev => ({ ...prev, payment_status: newStatus }));
    }
  };

  // Modifica esta función para validar y limitar el monto
  const handleAmountChange = (value: number) => {
    // Validar que el monto no supere el total de la orden
    if (selectedOrderTotal > 0 && value > selectedOrderTotal) {
      toast.warning(`El monto no puede superar el total de la orden: ${formatPriceCLP(selectedOrderTotal)}`);
      setFormData(prev => ({ ...prev, amount_paid: selectedOrderTotal }));
      updatePaymentStatus(selectedOrderTotal);
    } else {
      setFormData(prev => ({ ...prev, amount_paid: value }));
      updatePaymentStatus(value);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !formData.payment_type_id ||
      !formData.work_order_id ||
      !formData.payment_status ||
      formData.amount_paid < 0
    ) {
      toast.error("Por favor complete todos los campos obligatorios");
      return;
    }

    // Validación adicional antes de enviar
    if (selectedOrderTotal > 0 && formData.amount_paid > selectedOrderTotal) {
      toast.error(`El monto no puede superar el total de la orden: ${formatPriceCLP(selectedOrderTotal)}`);
      return;
    }

    try {
      setSubmitting(true);

      const paymentData: Partial<WorkPayment> = {
        payment_status: formData.payment_status,
        amount_paid: formData.amount_paid,
        payment_date: formData.payment_date,
        payment_type_id: parseInt(formData.payment_type_id),
        work_order_id: parseInt(formData.work_order_id)
      };

      if (isEditMode) {
        await updateWorkPayment(parseInt(id), paymentData);
        toast.success("Pago actualizado correctamente");
      } else {
        await createWorkPayment(paymentData);
        toast.success("Pago creado correctamente");
      }

      refreshPayments(); // Notificar al dashboard para que se actualice
      navigate("/admin/finanzas/pagos");
    } catch (error: any) {
      console.error("Error al guardar pago:", error);
      toast.error(
        error.response?.data?.message ||
        "Error al guardar el pago"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Filtra las órdenes de trabajo basado en el término de búsqueda
  const filteredWorkOrders = workOrders.filter((order) => {
    const searchValue = searchTerm.toLowerCase();
    // Busca en ID, matrícula, fecha, cliente, etc.
    return (
      order.work_order_id?.toString().includes(searchValue) ||
      (order.vehicle?.license_plate || "").toLowerCase().includes(searchValue) ||
      (order.vehicle?.owner?.name || "").toLowerCase().includes(searchValue) ||
      (order.vehicle?.company?.name || "").toLowerCase().includes(searchValue) ||
      (order.description || "").toLowerCase().includes(searchValue)
    );
  });

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-lg text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="container mx-auto p-6 max-w-3xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/finanzas/pagos")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          {isEditMode ? "Editar Pago" : "Nuevo Pago"}
        </h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="work_order_id">Orden de Trabajo*</Label>
                <div>
                  <Select
                    value={formData.work_order_id}
                    onValueChange={(value) => {
                      handleSelectChange("work_order_id", value);
                    }}
                    required
                  >
                    <SelectTrigger onClick={() => setIsWorkOrderSelectOpen(true)}>
                      <SelectValue placeholder="Seleccione una orden de trabajo">
                        {/* Personalizar la visualización cuando hay un valor seleccionado */}
                        {formData.work_order_id && (
                          (() => {
                            const selectedOrder = workOrders.find(order => order.work_order_id?.toString() === formData.work_order_id);
                            if (selectedOrder) {
                              return (
                                <span className="truncate">
                                  OT #{selectedOrder.work_order_id} - {selectedOrder.vehicle?.license_plate || "Sin patente"}
                                </span>
                              );
                            }
                            return formData.work_order_id;
                          })()
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      <div className="p-2 sticky top-0 bg-card z-10 border-b">
                        <Input
                          type="text"
                          placeholder="Buscar por ID, patente, cliente..."
                          value={searchTerm}
                          onChange={handleSearchChange}
                          className="mb-0"
                        />
                      </div>
                      {filteredWorkOrders.length > 0 ? (
                        filteredWorkOrders.map((order) => {
                          // Determinar el nombre del cliente (persona o empresa)
                          const clientName = order.vehicle?.owner
                            ? `${order.vehicle.owner.name || ""} ${order.vehicle.owner.first_surname || ""}`
                            : order.vehicle?.company?.name || "Sin cliente";

                          // Formatear la fecha
                          const orderDate = order.order_date
                            ? new Date(order.order_date).toLocaleDateString('es-CL')
                            : "Sin fecha";

                          // Traducir el estado
                          const statusMap: Record<string, string> = {
                            "not_started": "No iniciado",
                            "in_progress": "En progreso",
                            "finished": "Finalizado"
                          };
                          const status = statusMap[order.order_status] || order.order_status;

                          return (
                            <SelectItem key={order.work_order_id} value={order.work_order_id!.toString()}>
                              <div className="flex flex-col">
                                <span className="font-medium">OT #{order.work_order_id} - {formatPriceCLP(order.total_amount)}</span>
                                <span className="text-sm text-muted-foreground">
                                  {order.vehicle?.license_plate || "Sin patente"} | {orderDate} | {status}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Cliente: {clientName}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })
                      ) : (
                        <div className="p-2 text-center text-muted-foreground">
                          No se encontraron órdenes de trabajo
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="payment_type_id">Tipo de Pago*</Label>
                <Select
                  value={formData.payment_type_id}
                  onValueChange={(value) => handleSelectChange("payment_type_id", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un tipo de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentTypes.map((type) => (
                      <SelectItem key={type.payment_type_id} value={type.payment_type_id!.toString()}>
                        {type.type_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="payment_status">Estado del Pago*</Label>
                {isEditMode ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <Input
                          value={
                            formData.payment_status === "pendiente" ? "Pendiente" :
                              formData.payment_status === "parcial" ? "Parcial" :
                                formData.payment_status === "pagado" ? "Pagado" :
                                  formData.payment_status === "cancelado" ? "Cancelado" :
                                    formData.payment_status
                          }
                          disabled
                          className={`${formData.payment_status === "cancelado" ? "bg-red-100 text-red-700 border-red-300" : "bg-muted"}`}
                        />
                      </div>
                      {formData.payment_status !== "cancelado" ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                          onClick={() => handleSelectChange("payment_status", "cancelado")}
                        >
                          Cancelar pago
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 border-emerald-200"
                          onClick={() => {
                            // Restaurar el estado anterior basado en el monto, forzando la actualización
                            updatePaymentStatus(formData.amount_paid, selectedOrderTotal, true);
                          }}
                        >
                          Restaurar estado
                        </Button>
                      )}
                    </div>
                    <p className={`text-xs ${formData.payment_status === "cancelado" ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                      {formData.payment_status === "cancelado"
                        ? "Este pago ha sido cancelado. Puede restaurarlo si lo desea."
                        : "El botón 'Cancelar pago' anulará este pago. Esta acción se puede revertir."}
                    </p>
                  </div>
                ) : (
                  <div>
                    <Input
                      value={formData.payment_status === "pendiente" ? "Pendiente" :
                        formData.payment_status === "parcial" ? "Parcial" : "Pagado"}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      El estado se actualiza automáticamente según el monto pagado.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="amount_paid">Monto Pagado*</Label>
                <NumberInput
                  id="amount_paid"
                  value={formData.amount_paid}
                  onChange={handleAmountChange}
                  min={0}
                  max={selectedOrderTotal > 0 ? selectedOrderTotal : undefined}
                  isPrice
                  required
                  className="w-full"
                />
                {selectedOrderTotal > 0 && (
                  <div className="space-y-1 mt-1">
                    <p className="text-xs text-muted-foreground">
                      Total de la orden: {formatPriceCLP(selectedOrderTotal)} |
                      {formData.amount_paid < selectedOrderTotal ?
                        `Falta: ${formatPriceCLP(selectedOrderTotal - formData.amount_paid)}` :
                        'Monto completo'}
                    </p>
                    {formData.amount_paid > selectedOrderTotal && (
                      <p className="text-xs text-red-500 font-medium">
                        ⚠️ El monto no puede superar el total de la orden
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="payment_date">Fecha de Pago*</Label>
                <Input
                  id="payment_date"
                  name="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/finanzas/pagos")}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent mr-2"></span>
                    {isEditMode ? "Actualizando..." : "Guardando..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? "Actualizar" : "Guardar"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}