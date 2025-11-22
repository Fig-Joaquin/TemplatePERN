"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, CreditCard, Edit, Trash, FileText,
  Calendar, Wrench, Clock, CheckCircle, AlertCircle, DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { formatDate } from "@/utils/formDate";
import { fetchWorkPayments, deleteWorkPayment } from "@/services/work/workPayment";
import type { WorkPayment } from "@/types/interfaces";
import { usePaymentContext } from "@/contexts/PaymentContext";

export default function WorkPaymentsPage() {
  const navigate = useNavigate();
  const { refreshPayments } = usePaymentContext();
  const [payments, setPayments] = useState<WorkPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await fetchWorkPayments();
      console.log("Datos de pagos cargados:", data);
      console.log("Total de pagos encontrados:", data.length);
      setPayments(data);
    } catch (error: any) {
      console.error("Error al cargar los pagos:", error);
      toast.error(error.response?.data?.message || error.message || "Error al cargar los pagos");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (paymentId: number) => {
    setPaymentToDelete(paymentId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!paymentToDelete) return;

    try {
      await deleteWorkPayment(paymentToDelete);
      toast.success("Pago eliminado correctamente");
      setDeleteDialogOpen(false);
      fetchData();
      refreshPayments(); // Notificar al dashboard para que se actualice
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
        "Error al eliminar el pago"
      );
    } finally {
      setPaymentToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "outline" | "destructive" | "secondary" | "success"; label: string }> = {
      "pagado": { variant: "default", label: "Pagado" },
      "pendiente": { variant: "outline", label: "Pendiente" },
      "parcial": { variant: "secondary", label: "Parcial" },
      "cancelado": { variant: "destructive", label: "Cancelado" },
    };

    return statusMap[status.toLowerCase()] || { variant: "outline" as const, label: status };
  };

  const getWorkOrderStatusBadge = (status?: string) => {
    if (!status) return { variant: "outline" as const, label: "Sin estado", icon: AlertCircle };

    const statusMap: Record<string, { variant: "default" | "outline" | "destructive" | "secondary" | "success"; label: string; icon: any }> = {
      "not_started": { variant: "outline", label: "No iniciada", icon: Clock },
      "in_progress": { variant: "secondary", label: "En progreso", icon: Wrench },
      "finished": { variant: "success", label: "Finalizada", icon: CheckCircle },
    };

    return statusMap[status.toLowerCase()] || { variant: "outline" as const, label: status, icon: AlertCircle };
  };

  // Filtrado de pagos según el término de búsqueda
  const filteredPayments = payments.filter(payment => {
    const searchString = [
      payment.payment_type?.type_name,
      payment.work_order?.work_order_id,
      payment.payment_status,
      payment.work_order?.vehicle?.license_plate,
      payment.work_order?.vehicle?.owner?.name,
      payment.work_order?.vehicle?.owner?.number_phone,
      payment.work_order?.vehicle?.company?.name,
      payment.work_order?.description
    ].filter(Boolean).join(" ").toLowerCase();

    return searchString.includes(searchTerm.toLowerCase());
  });

  // Agrupar pagos por orden de trabajo
  const groupedPayments = filteredPayments.reduce((acc, payment) => {
    const workOrderId = payment.work_order?.work_order_id;
    if (!workOrderId) return acc;

    if (!acc[workOrderId]) {
      acc[workOrderId] = {
        workOrder: payment.work_order,
        payments: [],
        totalPaid: 0
      };
    }

    acc[workOrderId].payments.push(payment);
    acc[workOrderId].totalPaid += Number(payment.amount_paid);

    return acc;
  }, {} as Record<number, { workOrder: any; payments: WorkPayment[]; totalPaid: number }>);

  const groupedPaymentsArray = Object.values(groupedPayments);

  // Debug logging
  console.log("Pagos filtrados:", filteredPayments.length);
  console.log("Grupos de pagos:", groupedPaymentsArray.length);
  groupedPaymentsArray.forEach(group => {
    console.log(`Orden ${group.workOrder?.work_order_id}: ${group.payments.length} pagos`);
  });

  // Calcular el porcentaje de pago completado para una orden de trabajo
  const calculateWorkOrderPaymentPercentage = (totalPaid: number, workOrderTotal?: number) => {
    if (!workOrderTotal || workOrderTotal <= 0) return 100;
    return Math.min(100, Math.round((totalPaid / workOrderTotal) * 100));
  };

  // Obtener el estado general de pagos de una orden de trabajo
  const getWorkOrderPaymentStatus = (totalPaid: number, workOrderTotal?: number) => {
    if (!workOrderTotal || workOrderTotal <= 0) return "pagado";
    if (totalPaid >= workOrderTotal) return "pagado";
    if (totalPaid > 0) return "parcial";
    return "pendiente";
  };

  return (
    <motion.div
      className="container mx-auto p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          Pagos de Clientes
        </h1>
        <Button onClick={() => navigate("/admin/finanzas/pagos/nuevo")} className="bg-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Pago
        </Button>
      </div>

      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar pagos por tipo, orden, estado, cliente o descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Cargando pagos...</p>
        </div>
      ) : groupedPaymentsArray.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center py-16 px-4"
        >
          <div className="bg-muted/50 rounded-full p-8 mb-6">
            <CreditCard className="w-24 h-24 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            No se encontraron pagos
          </h2>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            {searchTerm
              ? "No hay pagos que coincidan con tu búsqueda. Intenta con otros términos."
              : "Aún no hay pagos registrados. Crea el primer pago para comenzar."}
          </p>
          <Button
            onClick={() => navigate("/admin/finanzas/pagos/nuevo")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear Primer Pago
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {groupedPaymentsArray.map((group) => {
              const { workOrder, payments, totalPaid } = group;
              const paymentPercentage = calculateWorkOrderPaymentPercentage(totalPaid, workOrder?.total_amount);
              const paymentStatus = getWorkOrderPaymentStatus(totalPaid, workOrder?.total_amount);
              const workOrderStatusBadge = getWorkOrderStatusBadge(workOrder?.order_status);
              const statusBadge = getStatusBadge(paymentStatus);

              return (
                <motion.div
                  key={workOrder?.work_order_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl font-semibold flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Orden de Trabajo #{workOrder?.work_order_id}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {payments.length} pago{payments.length !== 1 ? 's' : ''} registrado{payments.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge variant={statusBadge.variant as any}>
                            {statusBadge.label}
                          </Badge>
                          <Badge variant={workOrderStatusBadge.variant as any} className="flex items-center gap-1">
                            <workOrderStatusBadge.icon className="h-3 w-3" />
                            {workOrderStatusBadge.label}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        {/* Información del cliente y vehículo */}
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Cliente */}
                            <div>
                              <h4 className="font-semibold mb-2">Cliente:</h4>
                              {workOrder?.vehicle?.owner ? (
                                <div className="space-y-1 text-sm">
                                  <p><span className="font-medium">Nombre:</span> {workOrder.vehicle.owner.name} {workOrder.vehicle.owner.first_surname}</p>
                                  {workOrder.vehicle.owner.number_phone && (
                                    <p><span className="font-medium">Teléfono:</span> +{workOrder.vehicle.owner.number_phone}</p>
                                  )}
                                </div>
                              ) : workOrder?.vehicle?.company ? (
                                <div className="space-y-1 text-sm">
                                  <p><span className="font-medium">Empresa:</span> {workOrder.vehicle.company.name}</p>
                                  {workOrder.vehicle.company.phone && (
                                    <p><span className="font-medium">Teléfono:</span> {workOrder.vehicle.company.phone}</p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">No hay información del cliente</p>
                              )}
                            </div>

                            {/* Vehículo */}
                            <div>
                              <h4 className="font-semibold mb-2">Vehículo:</h4>
                              <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Matrícula:</span> {workOrder?.vehicle?.license_plate || "N/A"}</p>
                                {workOrder?.vehicle?.model && (
                                  <p><span className="font-medium">Modelo:</span> {workOrder.vehicle.model.brand?.brand_name} {workOrder.vehicle.model.model_name}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Resumen de pagos */}
                        <div className="bg-primary/5 rounded-lg p-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Resumen de Pagos
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Total Orden:</p>
                              <p className="text-lg font-bold text-primary">
                                {workOrder?.total_amount ? formatPriceCLP(Number(workOrder.total_amount)) : "No definido"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Pagado:</p>
                              <p className="text-lg font-bold text-green-600">
                                {formatPriceCLP(totalPaid)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Restante:</p>
                              <p className="text-lg font-bold text-red-600">
                                {workOrder?.total_amount
                                  ? formatPriceCLP(Math.max(0, Number(workOrder.total_amount) - totalPaid))
                                  : "N/A"
                                }
                              </p>
                            </div>
                          </div>

                          {/* Barra de progreso */}
                          {workOrder?.total_amount && (
                            <div className="mt-4 space-y-2">
                              <div className="flex justify-between text-xs">
                                <span>Progreso de pago: {paymentPercentage}%</span>
                                <span>
                                  {formatPriceCLP(totalPaid)} / {formatPriceCLP(Number(workOrder.total_amount))}
                                </span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2.5">
                                <div
                                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                                  style={{ width: `${paymentPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Historial de pagos */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Historial de Pagos ({payments.length})
                          </h4>
                          <div className="space-y-2">
                            {payments
                              .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                              .map((payment, index) => {
                                const paymentStatusBadge = getStatusBadge(payment.payment_status);
                                return (
                                  <div key={payment.work_payment_id} className="bg-card border rounded-lg p-3">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="font-medium">Pago #{payment.work_payment_id}</span>
                                          <Badge variant={paymentStatusBadge.variant as any} className="text-xs">
                                            {paymentStatusBadge.label}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs">
                                            {payment.payment_type?.type_name}
                                          </Badge>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                                          <p>
                                            <span className="font-medium">Fecha:</span> {formatDate(payment.payment_date)}
                                          </p>
                                          <p>
                                            <span className="font-medium">Monto:</span>
                                            <span className="text-primary font-semibold ml-1">
                                              {formatPriceCLP(Number(payment.amount_paid))}
                                            </span>
                                          </p>
                                          <p>
                                            <span className="font-medium">Pago #{index + 1} de {payments.length}</span>
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 ml-4">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => navigate(`/admin/finanzas/pagos/editar/${payment.work_payment_id}`)}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-destructive hover:text-destructive"
                                          onClick={() => handleDeleteClick(payment.work_payment_id!)}
                                        >
                                          <Trash className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        {/* Descripción de la orden */}
                        {workOrder?.description && (
                          <div>
                            <h4 className="font-semibold mb-2">Descripción del trabajo:</h4>
                            <p className="text-sm text-muted-foreground bg-muted/50 rounded p-3">
                              {workOrder.description}
                            </p>
                          </div>
                        )}

                        {/* Botón para ver orden completa */}
                        <div className="flex justify-center pt-2">
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/admin/orden-trabajo/editar/${workOrder?.work_order_id}`)}
                            className="flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            Ver Orden de Trabajo Completa
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Confirmar eliminación?</DialogTitle>
          </DialogHeader>
          <p>¿Estás seguro de que deseas eliminar este pago? Esta acción no se puede deshacer.</p>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}