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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { formatDate } from "@/utils/formDate";
import { fetchWorkPayments, deleteWorkPayment } from "@/services/work/workPayment";
import type { WorkPayment } from "@/types/interfaces";

export default function WorkPaymentsPage() {
  const navigate = useNavigate();
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
      setPayments(data);
    } catch (error) {
      console.error("Error al cargar los pagos:", error);
      toast.error("Error al cargar los pagos");
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

  // Calcular el porcentaje de pago completado
  const calculatePaymentPercentage = (payment: WorkPayment) => {
    if (!payment.work_order?.total_amount || payment.work_order.total_amount <= 0) return 100;
    return Math.min(100, Math.round((payment.amount_paid / payment.work_order.total_amount) * 100));
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
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No se encontraron pagos</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredPayments.map((payment) => {
                const statusBadge = getStatusBadge(payment.payment_status);
                const workOrderStatusBadge = getWorkOrderStatusBadge(payment.work_order?.order_status);
                const paymentPercentage = calculatePaymentPercentage(payment);
                
                return (
                  <motion.div
                    key={payment.work_payment_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-lg font-semibold">
                            Pago #{payment.work_payment_id}
                          </CardTitle>
                          <Badge variant="outline">{payment.payment_type?.type_name}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="space-y-4">
                          {/* Información básica del pago */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={statusBadge.variant as any}>
                                {statusBadge.label}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className="flex items-center gap-1 cursor-pointer"
                                onClick={() => {
                                  if (payment.work_order?.work_order_id) {
                                    navigate(`/admin/orden-trabajo/editar/${payment.work_order.work_order_id}`);
                                  }
                                }}
                              >
                                <FileText className="h-3 w-3" />
                                OT #{payment.work_order?.work_order_id}
                              </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(payment.payment_date)}
                              </span>
                              <Badge variant={workOrderStatusBadge.variant as any} className="flex items-center gap-1">
                                <workOrderStatusBadge.icon className="h-3 w-3" />
                                {workOrderStatusBadge.label}
                              </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                Monto:
                              </span>
                              <span className="text-lg font-bold text-primary">{formatPriceCLP(payment.amount_paid)}</span>
                            </div>
                            
                            {/* Barra de progreso de pago */}
                            {payment.work_order?.total_amount && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>Progreso de pago: {paymentPercentage}%</span>
                                  <span>
                                    {formatPriceCLP(payment.amount_paid)} / {formatPriceCLP(payment.work_order.total_amount)}
                                  </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2.5">
                                  <div 
                                    className="bg-primary h-2.5 rounded-full" 
                                    style={{ width: `${paymentPercentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <Separator />
                          
                          {/* Información detallada de la orden y vehículo */}
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="details">
                              <AccordionTrigger className="text-sm font-medium py-2">
                                Ver detalles
                              </AccordionTrigger>
                              <AccordionContent className="space-y-3 text-sm">
                                {/* Vehículo */}
                                {payment.work_order?.vehicle && (
                                  <div className="space-y-1">
                                    <h4 className="font-semibold">Vehículo:</h4>
                                    <p className="text-muted-foreground">
                                      <span className="font-medium">Matrícula:</span> {payment.work_order.vehicle.license_plate}
                                    </p>
                                    {payment.work_order.vehicle.model && (
                                      <p className="text-muted-foreground">
                                        <span className="font-medium">Modelo:</span> {payment.work_order.vehicle.model.brand?.brand_name} {payment.work_order.vehicle.model.model_name}
                                      </p>
                                    )}
                                  </div>
                                )}
                                
                                {/* Cliente */}
                                <div className="space-y-1">
                                  <h4 className="font-semibold">Cliente:</h4>
                                  {payment.work_order?.vehicle?.owner ? (
                                    <>
                                      <p className="text-muted-foreground">
                                        <span className="font-medium">Nombre:</span> {payment.work_order.vehicle.owner.name} {payment.work_order.vehicle.owner.first_surname}
                                      </p>
                                      {payment.work_order.vehicle.owner.number_phone && (
                                        <p className="text-muted-foreground">
                                          <span className="font-medium">Teléfono:</span> +{payment.work_order.vehicle.owner.number_phone}
                                        </p>
                                      )}
                                    </>
                                  ) : payment.work_order?.vehicle?.company ? (
                                    <>
                                      <p className="text-muted-foreground">
                                        <span className="font-medium">Empresa:</span> {payment.work_order.vehicle.company.name}
                                      </p>
                                      {payment.work_order.vehicle.company.phone && (
                                        <p className="text-muted-foreground">
                                          <span className="font-medium">Teléfono:</span> {payment.work_order.vehicle.company.phone}
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <p className="text-muted-foreground">No hay información del cliente</p>
                                  )}
                                </div>
                                
                                {/* Detalles de la orden */}
                                <div className="space-y-1">
                                  <h4 className="font-semibold">Orden de trabajo:</h4>
                                  <p className="text-muted-foreground">
                                    <span className="font-medium">Fecha:</span> {formatDate(payment.work_order?.entry_date || new Date())}
                                  </p>
                                  {payment.work_order?.entry_date && (
                                    <p className="text-muted-foreground">
                                      <span className="font-medium">Fecha de entrada:</span> {formatDate(payment.work_order.entry_date)}
                                    </p>
                                  )}
                                  {payment.work_order?.description && (
                                    <p className="text-muted-foreground">
                                      <span className="font-medium">Descripción:</span> {payment.work_order.description}
                                    </p>
                                  )}
                                  {payment.work_order?.technicians && payment.work_order.technicians.length > 0 && (
                                    <p className="text-muted-foreground">
                                      <span className="font-medium">Técnicos:</span> {payment.work_order.technicians.map(t => 
                                        'technician' in t && t.technician && typeof t.technician === 'object' && t.technician !== null && 'name' in t.technician ? 
                                        `${t.technician.name} ${(typeof t.technician === 'object' && t.technician !== null && 'first_surname' in t.technician && t.technician.first_surname) || ''}` : 
                                        'Sin nombre'
                                      ).join(', ')}
                                    </p>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>

                          <div className="flex justify-end gap-2 mt-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => navigate(`/admin/finanzas/pagos/editar/${payment.work_payment_id}`)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(payment.work_payment_id!)}
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Eliminar
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
        </>
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