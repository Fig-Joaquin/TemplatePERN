"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { CreditCard, Save, ArrowLeft, User, Car, Calendar, FileText, Check, ChevronsUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CurrencyInputCLP from "@/components/CurrencyInputCLP";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  createDebtor,
  updateDebtor,
  getDebtorById
} from "@/services/debtorService";
import { getAllWorkOrders, getAvailableWorkOrdersForDebtors } from "@/services/workOrderService";
import { formatPriceCLP, parseCLPToInteger } from "@/utils/formatPriceCLP";
import { translateWorkOrderStatus } from "@/utils/statusTranslations";
import { cn } from "@/lib/utils";
import type { Debtor, WorkOrder } from "@/types/interfaces";

interface DebtorFormData {
  work_order_id: string;
  description: string;
  total_amount: string;
}

interface DebtorPayload {
  work_order_id: number;
  description: string;
  total_amount?: number;
}

const getWorkOrderStatusBadgeClass = (status: WorkOrder["order_status"]): string => {
  switch (status) {
    case "finished":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "in_progress":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
  }
};

const mapDebtorToFormData = (debtor: Debtor): DebtorFormData => ({
  work_order_id: debtor.work_order_id?.toString() || "",
  description: debtor.description || "",
  total_amount: debtor.total_amount ? Math.trunc(Number(debtor.total_amount)).toString() : ""
});

const mapFormDataToPayload = (formData: DebtorFormData): DebtorPayload => {
  const totalAmount = parseCLPToInteger(formData.total_amount);

  return {
    work_order_id: Number.parseInt(formData.work_order_id, 10),
    description: formData.description.trim(),
    ...(totalAmount !== null && { total_amount: totalAmount })
  };
};

export default function DebtorFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workOrderSelectorOpen, setWorkOrderSelectorOpen] = useState(false);

  const [formData, setFormData] = useState<DebtorFormData>({
    work_order_id: "",
    description: "",
    total_amount: ""
  });

  // Obtener la orden de trabajo seleccionada
  const selectedWorkOrder = workOrders.find(wo => wo.work_order_id.toString() === formData.work_order_id);

  // Función para manejar la selección de orden de trabajo
  const handleWorkOrderSelect = (workOrderId: string) => {
    const selectedWO = workOrders.find(wo => wo.work_order_id.toString() === workOrderId);

    setFormData(prev => ({
      ...prev,
      work_order_id: workOrderId,
      // Auto-llenar el monto total con el monto de la orden de trabajo
      total_amount: selectedWO?.total_amount
        ? Math.trunc(Number(selectedWO.total_amount)).toString()
        : prev.total_amount,
      // Auto-generar descripción si está vacía
      description: prev.description || `Servicios realizados en orden de trabajo #${workOrderId}`
    }));

    setWorkOrderSelectorOpen(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Usar el nuevo servicio que filtra órdenes ya pagadas completamente
        const workOrdersData = isEditMode
          ? await getAllWorkOrders() // En modo edición, mostrar todas para permitir ver la orden actual
          : await getAvailableWorkOrdersForDebtors(); // En modo creación, solo mostrar disponibles
        setWorkOrders(workOrdersData);

        if (isEditMode && id) {
          const debtorData = await getDebtorById(Number.parseInt(id, 10));
          setFormData(mapDebtorToFormData(debtorData));
        }
      } catch (error: any) {
        console.error("Error al cargar datos:", error);
        toast.error(error.response?.data?.message || error.message || "Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.work_order_id) {
      toast.error("Debe seleccionar una orden de trabajo");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("La descripción es requerida");
      return;
    }

    const totalAmount = parseCLPToInteger(formData.total_amount);
    if (formData.total_amount && (totalAmount === null || totalAmount <= 0)) {
      toast.error("El monto total debe ser un número positivo");
      return;
    }

    try {
      setSubmitting(true);

      const debtorData = mapFormDataToPayload(formData);

      if (isEditMode && id) {
        await updateDebtor(Number.parseInt(id, 10), debtorData);
        toast.success("Deudor actualizado exitosamente");
      } else {
        await createDebtor(debtorData);
        toast.success("Deudor creado exitosamente");
      }

      navigate("/admin/finanzas/deudores");
    } catch (error: any) {
      console.error("Error al guardar deudor:", error);

      // Manejo mejorado de errores
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map((err: any) => err.message)
          .join(", ");
        toast.error(`Error de validación: ${errorMessages}`);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Error al guardar el deudor");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Cargando formulario...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="outline"
          onClick={() => navigate("/admin/finanzas/deudores")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Deudores
        </Button>

        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditMode ? "Editar" : "Nuevo"} Deudor
            </h1>
            <p className="text-muted-foreground">
              {isEditMode
                ? "Modifica la información del deudor"
                : "Registra una nueva deuda asociada a una orden de trabajo"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Información del Deudor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selección de Orden de Trabajo */}
              <div className="space-y-2">
                <Label htmlFor="work_order_id" className="text-sm font-medium">
                  Orden de Trabajo *
                </Label>
                <Popover open={workOrderSelectorOpen} onOpenChange={setWorkOrderSelectorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="work_order_id"
                      variant="outline"
                      role="combobox"
                      aria-expanded={workOrderSelectorOpen}
                      className="w-full justify-between h-auto py-3"
                    >
                      {selectedWorkOrder ? (
                        <div className="flex flex-col items-start text-left">
                          <span className="font-semibold text-primary">OT #{selectedWorkOrder.work_order_id}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[240px] sm:max-w-[420px]">
                            {selectedWorkOrder.vehicle?.owner?.name || selectedWorkOrder.vehicle?.company?.name || "Sin cliente"}
                            {" • "}
                            {formatPriceCLP(selectedWorkOrder.total_amount || 0)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Selecciona una orden de trabajo</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[min(95vw,720px)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar por N° OT, cliente o patente..." />
                      <CommandList className="max-h-80">
                        <CommandEmpty>No se encontraron órdenes de trabajo</CommandEmpty>
                        <CommandGroup>
                          {workOrders.map((workOrder) => {
                            const clientName = workOrder.vehicle?.owner?.name || workOrder.vehicle?.company?.name || "Sin cliente";
                            const statusLabel = translateWorkOrderStatus(workOrder.order_status);
                            const searchValue = `${workOrder.work_order_id} ${clientName} ${workOrder.vehicle?.license_plate || ""}`;

                            return (
                              <CommandItem
                                key={workOrder.work_order_id}
                                value={searchValue}
                                onSelect={() => handleWorkOrderSelect(workOrder.work_order_id.toString())}
                                className="p-3"
                              >
                                <div className="flex w-full items-start justify-between gap-3">
                                  <div className="min-w-0 space-y-1">
                                    <p className="font-semibold text-primary">OT #{workOrder.work_order_id}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {clientName} • {workOrder.vehicle?.license_plate || "Sin patente"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(workOrder.order_date).toLocaleDateString("es-CL")}
                                    </p>
                                  </div>

                                  <div className="flex shrink-0 flex-col items-end gap-2">
                                    <p className="text-sm font-bold text-green-600">{formatPriceCLP(workOrder.total_amount || 0)}</p>
                                    <Badge className={cn("text-[10px]", getWorkOrderStatusBadgeClass(workOrder.order_status))}>
                                      {statusLabel}
                                    </Badge>
                                  </div>
                                </div>
                                <Check
                                  className={cn(
                                    "ml-2 h-4 w-4",
                                    formData.work_order_id === workOrder.work_order_id.toString() ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Información de la Orden de Trabajo Seleccionada */}
              {selectedWorkOrder && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2 mb-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Información de la Orden de Trabajo</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div>
                        <span className="font-medium text-muted-foreground">Orden:</span>
                        <p className="font-semibold">#{selectedWorkOrder.work_order_id}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <span className="font-medium text-muted-foreground">Estado:</span>
                        <p>{selectedWorkOrder.order_status ? translateWorkOrderStatus(selectedWorkOrder.order_status) : 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium text-muted-foreground">Vehículo:</span>
                        <p className="font-semibold">{selectedWorkOrder.vehicle?.license_plate || 'Sin vehículo'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium text-muted-foreground">Cliente:</span>
                        <p>{selectedWorkOrder.vehicle?.owner?.name || selectedWorkOrder.vehicle?.company?.name || 'Sin cliente'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <span className="font-medium text-muted-foreground">Monto Total:</span>
                        <p className="font-bold text-green-600">
                          {formatPriceCLP(selectedWorkOrder.total_amount || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium text-muted-foreground">Fecha:</span>
                        <p>{new Date(selectedWorkOrder.order_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {selectedWorkOrder.description && (
                    <div className="mt-3 p-3 bg-background/50 rounded-md">
                      <span className="font-medium text-muted-foreground text-sm">Descripción del trabajo:</span>
                      <p className="text-sm mt-1">{selectedWorkOrder.description}</p>
                    </div>
                  )}

                  <div className="mt-3 p-3 bg-primary/10 rounded-md border border-primary/20">
                    <p className="text-sm text-primary">
                      💡 <strong>Información:</strong> El monto de la deuda se ha establecido automáticamente
                      con el valor total de la orden de trabajo. Puedes modificarlo si es necesario.
                    </p>
                  </div>
                </div>
              )}

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Descripción de la Deuda *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe el motivo de la deuda, servicios realizados, productos, etc..."
                  className="min-h-[120px] resize-none"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Máximo 255 caracteres ({formData.description.length}/255)
                </p>
              </div>

              {/* Monto Total */}
              <div className="space-y-2">
                <Label htmlFor="total_amount" className="text-sm font-medium">
                  Monto Total de la Deuda (opcional)
                </Label>
                <CurrencyInputCLP
                  id="total_amount"
                  value={formData.total_amount}
                  onValueChange={(numericValue) =>
                    handleInputChange("total_amount", numericValue === null ? "" : numericValue.toString())
                  }
                  placeholder="Ej: $150.000"
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  Define el monto total de la deuda para llevar control de pagos y porcentajes
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/finanzas/deudores")}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isEditMode ? "Actualizando..." : "Creando..."}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditMode ? "Actualizar" : "Crear"} Deudor
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
