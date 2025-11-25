"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, Table as TableIcon, LayoutGrid, FileText, MoreHorizontal, Eye, Edit, UserPlus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { getAllWorkOrders, deleteWorkOrder } from "@/services/workOrderService";
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
      className="container mx-auto p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >

      {/* Encabezado: título, buscador, selector de ordenación, toggle de vista y botón "Nueva Orden" */}
      <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
        <FileText className="w-8 h-8" />
        Órdenes de Trabajo
      </h1>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-72">
            <Input
              type="text"
              placeholder="Buscar por matrícula, teléfono o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
          </div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "recent" | "oldest")}
            className="border rounded p-2 bg-background text-foreground border-border"
          >
            <option value="recent">Más recientes</option>
            <option value="oldest">Más antiguas</option>
          </select>
          {/* Botones para alternar vista */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <TableIcon className="w-5 h-5" />
              Tabla
            </Button>
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("card")}
            >
              <LayoutGrid className="w-5 h-5" />
              Tarjetas
            </Button>
          </div>
          <Button onClick={() => navigate("/admin/nueva-orden-trabajo")}>
            Nueva Orden
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Cargando...</p>
        </div>
      ) : visibleWorkOrders.length > 0 ? (
        <>
          {viewMode === "table" ? (
            // Vista en Tabla
            <div className="rounded-md border" style={{ backgroundColor: 'var(--card)' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Patente</TableHead>
                    <TableHead>Dueño</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Cotización</TableHead>
                    <TableHead>Mécanico</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleWorkOrders.map((wo) => {
                    // Datos del vehículo
                    const vehicle = wo.vehicle;
                    const plate = vehicle?.license_plate || "No especificado";
                    const owner = vehicle?.owner;
                    const ownerName = owner
                      ? `${owner.name} ${owner.first_surname}`
                      : vehicle?.company
                        ? vehicle.company.name
                        : "No especificado";
                    const ownerPhone = owner
                      ? owner.number_phone || "No especificado"
                      : vehicle?.company
                        ? vehicle.company.phone || "No especificado"
                        : "No especificado";

                    // Nueva implementación para mostrar técnicos igual que en WorkOrderCard
                    const assignedTechnicians = techniciansByOrderId[wo.work_order_id] || [];
                    let technicianNames = "No asignado";

                    if (assignedTechnicians.length > 0) {
                      technicianNames = assignedTechnicians
                        .map(tech => {
                          if (!tech || !tech.technician) return "Mécanico sin datos";
                          const name = `${tech.technician.name || "Sin nombre"} ${tech.technician.first_surname || ""}`;
                          const date = tech.assigned_at ?
                            new Date(tech.assigned_at).toLocaleDateString('es-CL', {
                              day: '2-digit',
                              month: '2-digit'
                            }) : '';
                          return date ? `${name} (${date})` : name;
                        })
                        .join(', ');
                    }

                    return (
                      <TableRow key={wo.work_order_id}>
                        <TableCell>{wo.work_order_id}</TableCell>
                        <TableCell>{formatDate(wo.order_date)}</TableCell>
                        <TableCell className="text-right">{formatPriceCLP(wo.total_amount)}</TableCell>
                        <TableCell>{translateStatus(wo.order_status)}</TableCell>
                        <TableCell>{plate}</TableCell>
                        <TableCell>{ownerName}</TableCell>
                        <TableCell>+{ownerPhone}</TableCell>
                        <TableCell>{wo.quotation ? "Sí" : "No"}</TableCell>
                        <TableCell>{technicianNames}</TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted focus:bg-muted">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setSelectedWorkOrder(wo)}
                                className="cursor-pointer hover:bg-blue-500/10 focus:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:focus:bg-blue-500/20"
                              >
                                <Eye className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                                Ver Detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => navigate(`/admin/orden-trabajo/editar/${wo.work_order_id}`)}
                                className="cursor-pointer hover:bg-green-500/10 focus:bg-green-500/10 dark:hover:bg-green-500/20 dark:focus:bg-green-500/20"
                              >
                                <Edit className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCreateDebtor(wo)}
                                className="cursor-pointer hover:bg-orange-500/10 focus:bg-orange-500/10 dark:hover:bg-orange-500/20 dark:focus:bg-orange-500/20"
                              >
                                <UserPlus className="mr-2 h-4 w-4 text-orange-600 dark:text-orange-400" />
                                Crear Deudor
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(wo)}
                                className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 dark:hover:bg-red-500/20 dark:focus:bg-red-500/20"
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
            // Vista en Tarjetas
            <motion.div
              className="grid grid-cols-1 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <AnimatePresence>
                {visibleWorkOrders.map((wo) => (
                  <motion.div
                    key={wo.work_order_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <WorkOrderCard
                      workOrder={wo}
                      onCreateDebtor={handleCreateDebtor}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
          {visibleWorkOrders.length < sortedWorkOrders.length && (
            <div className="flex justify-center mt-4">
              <Button onClick={handleLoadMore}>Cargar más</Button>
            </div>
          )}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center py-16 px-4"
        >
          <div className="bg-muted/50 rounded-full p-8 mb-6">
            <FileText className="w-24 h-24 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            No se encontraron órdenes de trabajo
          </h2>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            {searchTerm
              ? "No hay órdenes que coincidan con tu búsqueda. Intenta con otros términos."
              : "Aún no hay órdenes de trabajo registradas. Crea la primera orden para comenzar."}
          </p>
          <Button
            onClick={() => navigate("/admin/nueva-orden-trabajo")}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Crear Primera Orden
          </Button>
        </motion.div>
      )}

      {/* Modal para ver detalles en vista de tabla */}
      {selectedWorkOrder && (
        <Dialog open={true} onOpenChange={() => setSelectedWorkOrder(null)}>
          <DialogContent className="bg-card text-card-foreground max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Detalles de la Orden #{selectedWorkOrder.work_order_id}
              </DialogTitle>
            </DialogHeader>
            {/* Usamos la misma card existente */}
            <WorkOrderCard
              workOrder={selectedWorkOrder}
              onCreateDebtor={handleCreateDebtor}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de confirmación para eliminar */}
      {showDeleteConfirm && workOrderToDelete && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-destructive">¡Advertencia! Eliminación Permanente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-center font-medium text-foreground">
                ¿Estás seguro de que deseas eliminar la orden de trabajo <strong>#{workOrderToDelete.work_order_id}</strong>?
              </p>
              <div className="bg-muted border border-border rounded-md p-3 text-sm">
                <p className="text-foreground"><strong>Orden:</strong> #{workOrderToDelete.work_order_id}</p>
                <p className="text-foreground"><strong>Estado:</strong> {translateStatus(workOrderToDelete.order_status)}</p>
                <p className="text-foreground"><strong>Vehículo:</strong> {workOrderToDelete.vehicle?.license_plate || "N/A"}</p>
              </div>
              <div className="bg-accent/10 border border-accent/20 rounded-md p-3 text-sm">
                <p className="text-foreground"><strong>ATENCIÓN:</strong> Esta acción realizará lo siguiente:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-foreground">
                  <li>Eliminará la orden de trabajo permanentemente</li>
                  <li>Restaurará el stock de productos utilizados</li>
                  <li>Eliminará todos los pagos asociados</li>
                  <li>Eliminará todos los técnicos asignados</li>
                </ul>
                <p className="mt-2 font-semibold text-foreground">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <Button variant="outline" onClick={handleDeleteCancel}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Eliminar permanentemente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal para crear deudor */}
      {showCreateDebtorModal && workOrderForDebtor && (
        <Dialog open={showCreateDebtorModal} onOpenChange={setShowCreateDebtorModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                Crear Deudor
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted border border-border rounded-md p-3 text-sm">
                <p className="text-foreground"><strong>Orden de Trabajo:</strong> #{workOrderForDebtor.work_order_id}</p>
                <p className="text-foreground"><strong>Vehículo:</strong> {workOrderForDebtor.vehicle?.license_plate || "N/A"}</p>
                <p className="text-foreground"><strong>Cliente:</strong> {
                  workOrderForDebtor.vehicle?.owner
                    ? `${workOrderForDebtor.vehicle.owner.name} ${workOrderForDebtor.vehicle.owner.first_surname}`
                    : workOrderForDebtor.vehicle?.company?.name || "N/A"
                }</p>
                <p className="text-foreground"><strong>Total de la Orden:</strong> {formatPriceCLP(workOrderForDebtor.total_amount)}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="debtor-description">Descripción de la Deuda</Label>
                <Textarea
                  id="debtor-description"
                  value={debtorDescription}
                  onChange={(e) => setDebtorDescription(e.target.value)}
                  placeholder="Describe el motivo de la deuda..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="debtor-amount">Monto de la Deuda</Label>
                <Input
                  id="debtor-amount"
                  type="number"
                  value={debtorAmount}
                  onChange={(e) => setDebtorAmount(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleCreateDebtorCancel}
                disabled={creatingDebtor}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateDebtorSubmit}
                disabled={creatingDebtor || !debtorDescription.trim()}
                className="bg-orange-600 hover:bg-orange-700"
              >
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
