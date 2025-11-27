"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, Table as TableIcon, LayoutGrid, MoreHorizontal, Eye, Edit, UserPlus, Trash2, Plus, Play, Pause, CheckCircle, CreditCard } from "lucide-react";
import { toast } from "react-toastify";
import { getAllWorkOrders, deleteWorkOrder, updateWorkOrder } from "@/services/workOrderService";
import { createDebtor } from "@/services/debtorService";
import WorkOrderCard from "@/components/workOrders/WorkOrderCard";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { formatDate } from "@/utils/formDate";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getWorkOrderTechnicians } from "@/services/workOrderTechnicianService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WorkOrdersPage = () => {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest">("recent");
  const [visibleCount, setVisibleCount] = useState<number>(6);
  // Estado para alternar entre vista "table" y "card"
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  // Estado para el modal de detalle (en tabla)
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null);
  // Nuevo estado para almacenar técnicos por orden de trabajo
  const [techniciansByOrderId, setTechniciansByOrderId] = useState<{ [key: number]: any[] }>({});
  // Estado para confirmación de eliminación
  const [workOrderToDelete, setWorkOrderToDelete] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Estados para crear deudor
  const [showCreateDebtorModal, setShowCreateDebtorModal] = useState<boolean>(false);
  const [workOrderForDebtor, setWorkOrderForDebtor] = useState<any>(null);
  const [debtorDescription, setDebtorDescription] = useState<string>("");
  const [debtorAmount, setDebtorAmount] = useState<number>(0);
  const [creatingDebtor, setCreatingDebtor] = useState<boolean>(false);

  const navigate = useNavigate();

  const translateStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      finished: "Finalizado",
      in_progress: "En progreso",
      not_started: "No iniciado",
    };
    return statusMap[status] || status; // Retorna el valor original si no coincide
  };

  const handleDeleteClick = (workOrder: any) => {
    setWorkOrderToDelete(workOrder);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!workOrderToDelete) return;

    try {
      await deleteWorkOrder(workOrderToDelete.work_order_id);
      toast.success("Orden eliminada correctamente y stock restaurado");
      loadWorkOrders();
    } catch (error: any) {
      console.error("Error al eliminar la orden:", error);
      toast.error(error?.response?.data?.message || "Error al eliminar la orden");
    } finally {
      setShowDeleteConfirm(false);
      setWorkOrderToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setWorkOrderToDelete(null);
  };

  // Función para iniciar una orden de trabajo
  const handleStartWorkOrder = async (workOrder: any) => {
    try {
      await updateWorkOrder(workOrder.work_order_id, { order_status: "in_progress" });
      toast.success(`Orden #${workOrder.work_order_id} iniciada correctamente`);
      loadWorkOrders();
    } catch (error: any) {
      console.error("Error al iniciar la orden:", error);
      toast.error(error?.response?.data?.message || "Error al iniciar la orden");
    }
  };

  // Función para pausar una orden de trabajo (volver a no iniciado)
  const handlePauseWorkOrder = async (workOrder: any) => {
    try {
      await updateWorkOrder(workOrder.work_order_id, { order_status: "not_started" });
      toast.success(`Orden #${workOrder.work_order_id} pausada correctamente`);
      loadWorkOrders();
    } catch (error: any) {
      console.error("Error al pausar la orden:", error);
      toast.error(error?.response?.data?.message || "Error al pausar la orden");
    }
  };

  // Función para finalizar una orden de trabajo
  const handleFinishWorkOrder = async (workOrder: any) => {
    try {
      await updateWorkOrder(workOrder.work_order_id, { order_status: "finished" });
      toast.success(`Orden #${workOrder.work_order_id} finalizada correctamente`);
      loadWorkOrders();
    } catch (error: any) {
      console.error("Error al finalizar la orden:", error);
      toast.error(error?.response?.data?.message || "Error al finalizar la orden");
    }
  };

  // Función para abrir el modal de crear deudor
  const handleCreateDebtor = (workOrder: any) => {
    setWorkOrderForDebtor(workOrder);
    setDebtorDescription(`Deuda por orden de trabajo #${workOrder.work_order_id} - ${workOrder.vehicle?.license_plate || 'Sin vehículo'}`);
    setDebtorAmount(Number(workOrder.total_amount) || 0);
    setShowCreateDebtorModal(true);
  };

  // Función para crear el deudor
  const handleCreateDebtorSubmit = async () => {
    if (!workOrderForDebtor || !debtorDescription.trim()) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setCreatingDebtor(true);
    try {
      const debtorData = {
        work_order_id: workOrderForDebtor.work_order_id,
        description: debtorDescription,
        total_amount: Number(debtorAmount),
        paid_amount: 0,
        payment_status: "pendiente"
      };

      await createDebtor(debtorData);
      toast.success(`Deudor creado exitosamente para la orden #${workOrderForDebtor.work_order_id}`);

      // Cerrar modal y limpiar estados
      setShowCreateDebtorModal(false);
      setWorkOrderForDebtor(null);
      setDebtorDescription("");
      setDebtorAmount(0);
    } catch (error: any) {
      console.error("Error al crear deudor:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Error al crear el deudor");
      }
    } finally {
      setCreatingDebtor(false);
    }
  };

  // Función para cancelar la creación del deudor
  const handleCreateDebtorCancel = () => {
    setShowCreateDebtorModal(false);
    setWorkOrderForDebtor(null);
    setDebtorDescription("");
    setDebtorAmount(0);
  };

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const loadWorkOrders = async () => {
    setLoading(true);
    try {
      const data = await getAllWorkOrders();
      setWorkOrders(data);

      // Fetch technicians for each work order
      const techsObj: { [key: number]: any[] } = {};
      for (const order of data) {
        try {
          const techs = await getWorkOrderTechnicians(order.work_order_id);
          techsObj[order.work_order_id] = techs;
        } catch (error) {
          console.error(`Error loading technicians for order #${order.work_order_id}:`, error);
          techsObj[order.work_order_id] = [];
        }
      }
      setTechniciansByOrderId(techsObj);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Error al cargar órdenes de trabajo");
    } finally {
      setLoading(false);
    }
  };

  // Mapeo de datos: si la orden tiene cotización, se usan sus detalles; sino, se usan los directos.
  const data = workOrders.map((wo) => ({
    ...wo,
    details: wo.quotation ? wo.quotation.productDetails : wo.productDetails || [],
  }));

  // Filtrado por búsqueda: se busca en la matrícula, dueño y empresa
  const searchLower = searchTerm.toLowerCase();
  const filteredWorkOrders = data.filter((wo) => {
    const vehicle = wo.vehicle;
    const plate = vehicle?.license_plate?.toLowerCase() || "";

    const owner = vehicle?.owner;
    let ownerFullName = "";
    let ownerPhone = "";
    if (owner) {
      ownerFullName = `${owner.name || ""} ${owner.first_surname || ""} ${owner.second_surname || ""}`.toLowerCase();
      ownerPhone = owner.number_phone?.toLowerCase() || "";
    }

    const company = vehicle?.company;
    let companyName = "";
    let companyPhone = "";
    if (company) {
      companyName = company.name?.toLowerCase() || "";
      companyPhone = company.phone?.toLowerCase() || "";
    }

    return (
      plate.includes(searchLower) ||
      ownerFullName.includes(searchLower) ||
      ownerPhone.includes(searchLower) ||
      companyName.includes(searchLower) ||
      companyPhone.includes(searchLower)
    );
  });

  // Ordenar por fecha según el criterio seleccionado
  const sortedWorkOrders = filteredWorkOrders.sort((a, b) => {
    if (sortOrder === "recent") {
      return new Date(b.order_date).getTime() - new Date(a.order_date).getTime();
    } else {
      return new Date(a.order_date).getTime() - new Date(b.order_date).getTime();
    }
  });

  // Mostrar solo las órdenes visibles según la paginación
  const visibleWorkOrders = sortedWorkOrders.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  return (
    <motion.div
      className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Órdenes de Trabajo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de órdenes de trabajo
          </p>
        </div>
        <Button onClick={() => navigate("/admin/nueva-orden-trabajo")}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Orden
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por patente, teléfono o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={sortOrder} onValueChange={(value: "recent" | "oldest") => setSortOrder(value)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Más recientes</SelectItem>
            <SelectItem value="oldest">Más antiguas</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex border rounded-md">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="rounded-r-none"
          >
            <TableIcon className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "card" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("card")}
            className="rounded-l-none border-l"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : visibleWorkOrders.length > 0 ? (
        <>
          {viewMode === "table" ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-medium">ID</TableHead>
                    <TableHead className="font-medium">Fecha</TableHead>
                    <TableHead className="font-medium text-right">Total</TableHead>
                    <TableHead className="font-medium">Estado</TableHead>
                    <TableHead className="font-medium">Patente</TableHead>
                    <TableHead className="font-medium">Cliente</TableHead>
                    <TableHead className="font-medium">Teléfono</TableHead>
                    <TableHead className="font-medium">Cotización</TableHead>
                    <TableHead className="font-medium">Mecánico</TableHead>
                    <TableHead className="font-medium text-center w-16">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleWorkOrders.map((wo) => {
                    const vehicle = wo.vehicle;
                    const plate = vehicle?.license_plate || "—";
                    const owner = vehicle?.owner;
                    const ownerName = owner
                      ? `${owner.name} ${owner.first_surname}`
                      : vehicle?.company
                        ? vehicle.company.name
                        : "—";
                    const ownerPhone = owner
                      ? owner.number_phone || "—"
                      : vehicle?.company
                        ? vehicle.company.phone || "—"
                        : "—";

                    const assignedTechnicians = techniciansByOrderId[wo.work_order_id] || [];
                    let technicianNames = "—";

                    if (assignedTechnicians.length > 0) {
                      technicianNames = assignedTechnicians
                        .map(tech => {
                          if (!tech?.technician) return "Sin datos";
                          return `${tech.technician.name || ""} ${tech.technician.first_surname || ""}`.trim();
                        })
                        .join(', ');
                    }

                    const getStatusBadge = (status: string) => {
                      const styles: Record<string, string> = {
                        finished: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                        in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                        not_started: "bg-muted text-muted-foreground",
                      };
                      return (
                        <Badge variant="secondary" className={cn("font-normal", styles[status] || styles.not_started)}>
                          {translateStatus(status)}
                        </Badge>
                      );
                    };

                    return (
                      <TableRow key={wo.work_order_id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">#{wo.work_order_id}</TableCell>
                        <TableCell>{formatDate(wo.order_date)}</TableCell>
                        <TableCell className="text-right font-medium">{formatPriceCLP(wo.total_amount)}</TableCell>
                        <TableCell>{getStatusBadge(wo.order_status)}</TableCell>
                        <TableCell className="font-mono text-sm">{plate}</TableCell>
                        <TableCell className="max-w-[140px] truncate">{ownerName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {ownerPhone !== "—" ? `+${ownerPhone}` : "—"}
                        </TableCell>
                        <TableCell>
                          {wo.quotation ? (
                            <Badge variant="outline" className="font-normal">Sí</Badge>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate text-muted-foreground">
                          {technicianNames}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedWorkOrder(wo)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/admin/orden-trabajo/editar/${wo.work_order_id}`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              {wo.order_status === "not_started" && (
                                <DropdownMenuItem onClick={() => handleStartWorkOrder(wo)}>
                                  <Play className="mr-2 h-4 w-4" />
                                  Iniciar Orden
                                </DropdownMenuItem>
                              )}
                              {wo.order_status === "in_progress" && (
                                <>
                                  <DropdownMenuItem onClick={() => handlePauseWorkOrder(wo)}>
                                    <Pause className="mr-2 h-4 w-4" />
                                    Pausar Orden
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleFinishWorkOrder(wo)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Finalizar Orden
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem onClick={() => navigate(`/admin/finanzas/pagos/nuevo?workOrderId=${wo.work_order_id}`)}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Registrar Pago
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCreateDebtor(wo)}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Crear Deudor
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(wo)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence>
                {visibleWorkOrders.map((wo) => (
                  <motion.div
                    key={wo.work_order_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <WorkOrderCard
                      workOrder={wo}
                      onCreateDebtor={handleCreateDebtor}
                      onStartOrder={() => loadWorkOrders()}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {visibleWorkOrders.length < sortedWorkOrders.length && (
            <div className="flex justify-center mt-6">
              <Button variant="outline" onClick={handleLoadMore}>
                Cargar más ({sortedWorkOrders.length - visibleWorkOrders.length} restantes)
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-1">
              No se encontraron órdenes
            </h2>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              {searchTerm
                ? "No hay órdenes que coincidan con tu búsqueda."
                : "Aún no hay órdenes de trabajo registradas."}
            </p>
            <Button onClick={() => navigate("/admin/nueva-orden-trabajo")}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Orden
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal para ver detalles */}
      {selectedWorkOrder && (
        <Dialog open={true} onOpenChange={() => setSelectedWorkOrder(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Orden de Trabajo #{selectedWorkOrder.work_order_id}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <WorkOrderCard
                workOrder={selectedWorkOrder}
                onCreateDebtor={handleCreateDebtor}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de confirmación para eliminar */}
      {showDeleteConfirm && workOrderToDelete && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Eliminar Orden de Trabajo</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                ¿Confirma la eliminación de la orden <strong className="text-foreground">#{workOrderToDelete.work_order_id}</strong>?
              </p>

              <div className="bg-muted rounded-md p-3 text-sm space-y-1 mb-4">
                <p><span className="text-muted-foreground">Estado:</span> {translateStatus(workOrderToDelete.order_status)}</p>
                <p><span className="text-muted-foreground">Vehículo:</span> {workOrderToDelete.vehicle?.license_plate || "N/A"}</p>
              </div>

              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm">
                <p className="font-medium text-destructive mb-2">Esta acción:</p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Eliminará la orden permanentemente</li>
                  <li>• Restaurará el stock de productos</li>
                  <li>• Eliminará pagos y técnicos asociados</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleDeleteCancel}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal para crear deudor */}
      {showCreateDebtorModal && workOrderForDebtor && (
        <Dialog open={showCreateDebtorModal} onOpenChange={setShowCreateDebtorModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Deudor</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="bg-muted rounded-md p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">Orden:</span> #{workOrderForDebtor.work_order_id}</p>
                <p><span className="text-muted-foreground">Vehículo:</span> {workOrderForDebtor.vehicle?.license_plate || "N/A"}</p>
                <p><span className="text-muted-foreground">Cliente:</span> {
                  workOrderForDebtor.vehicle?.owner
                    ? `${workOrderForDebtor.vehicle.owner.name} ${workOrderForDebtor.vehicle.owner.first_surname}`
                    : workOrderForDebtor.vehicle?.company?.name || "N/A"
                }</p>
                <p><span className="text-muted-foreground">Total:</span> <span className="font-medium">{formatPriceCLP(workOrderForDebtor.total_amount)}</span></p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="debtor-description">Descripción</Label>
                <Textarea
                  id="debtor-description"
                  value={debtorDescription}
                  onChange={(e) => setDebtorDescription(e.target.value)}
                  placeholder="Motivo de la deuda..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="debtor-amount">Monto</Label>
                <Input
                  id="debtor-amount"
                  type="number"
                  value={debtorAmount}
                  onChange={(e) => setDebtorAmount(Number.parseFloat(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCreateDebtorCancel} disabled={creatingDebtor}>
                Cancelar
              </Button>
              <Button onClick={handleCreateDebtorSubmit} disabled={creatingDebtor || !debtorDescription.trim()}>
                {creatingDebtor ? "Creando..." : "Crear Deudor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
};

export default WorkOrdersPage;
