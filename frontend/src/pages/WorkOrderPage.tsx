"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, Table as TableIcon, LayoutGrid } from "lucide-react";
import { toast } from "react-toastify";
import { getAllWorkOrders, deleteWorkOrder } from "@/services/workOrderService";
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
} from "@/components/ui/dialog";

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

  const navigate = useNavigate();

  const translateStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      finished: "Finalizado",
      in_progress: "En progreso",
      not_started: "No iniciado",
    };
    return statusMap[status] || status; // Retorna el valor original si no coincide
  };


  useEffect(() => {
    loadWorkOrders();
  }, []);

  const loadWorkOrders = async () => {
    setLoading(true);
    try {
      const data = await getAllWorkOrders();
      setWorkOrders(data);
    } catch (error) {
      toast.error("Error al cargar órdenes de trabajo");
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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl font-bold">Órdenes de Trabajo</h1>
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
            className="border rounded p-2"
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
          <Button onClick={() => navigate("/admin/orden-trabajo/nuevo")}>
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
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">ID</th>
                    <th className="border px-4 py-2 text-left">Fecha</th>
                    <th className="border px-4 py-2 text-right">Total</th>
                    <th className="border px-4 py-2 text-left">Estado</th>
                    <th className="border px-4 py-2 text-left">Patente</th>
                    <th className="border px-4 py-2 text-left">Dueño</th>
                    <th className="border px-4 py-2 text-left">Teléfono</th>
                    <th className="border px-4 py-2 text-left">Cotización</th>
                    <th className="border px-4 py-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
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
                    return (
                      <tr key={wo.work_order_id} className="hover:bg-gray-50">
                        <td className="border px-4 py-2">{wo.work_order_id}</td>
                        <td className="border px-4 py-2">{formatDate(wo.order_date)}</td>
                        <td className="border px-4 py-2 text-right">{formatPriceCLP(wo.total_amount)}</td>
                        <td className="border px-4 py-2">{translateStatus(wo.order_status)}</td>
                        <td className="border px-4 py-2">{plate}</td>
                        <td className="border px-4 py-2">{ownerName}</td>
                        <td className="border px-4 py-2">+{ownerPhone}</td>
                        <td className="border px-4 py-2">{wo.quotation ? "Sí" : "No"}</td>
                        <td className="border px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedWorkOrder(wo)}
                            >
                              Ver Detalles
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/orden-trabajo/editar/${wo.work_order_id}`)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await deleteWorkOrder(wo.work_order_id);
                                  toast.success("Orden eliminada correctamente");
                                  loadWorkOrders();
                                } catch (error) {
                                  toast.error("Error al eliminar la orden");
                                }
                              }}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
                    <WorkOrderCard workOrder={wo} />
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
        <p>No se encontraron órdenes de trabajo.</p>
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
            <WorkOrderCard workOrder={selectedWorkOrder} />
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
};

export default WorkOrdersPage;
