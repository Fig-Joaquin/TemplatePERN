"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, Table as TableIcon, LayoutGrid, Plus, Edit, Trash2, FileX, Calendar, User, CreditCard, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";
import { getAllDebtors, deleteDebtor } from "@/services/debtorService";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "@/utils/formDate";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Debtor } from "@/types/interfaces";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Componente DebtorCard optimizado
const DebtorCard = ({ debtor, onEdit, onDelete }: {
  debtor: Debtor;
  onEdit: (id: number) => void;
  onDelete: (debtor: Debtor) => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="bg-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center space-x-3">
        <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
          <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">
            OT #{debtor.workOrder?.work_order_id || "N/A"}
          </h3>
          <p className="text-sm text-muted-foreground font-medium">
            {debtor.workOrder?.vehicle?.license_plate || "Sin vehículo"}
          </p>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(debtor.debtor_id)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(debtor)}
          className="hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>

    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Cliente:</span>
        <span className="text-sm">
          {debtor.workOrder?.vehicle?.owner?.name ||
            debtor.workOrder?.vehicle?.company?.name || "N/A"}
        </span>
      </div>

      <div className="flex items-start space-x-2">
        <FileX className="h-4 w-4 text-muted-foreground mt-0.5" />
        <div>
          <span className="text-sm font-medium text-muted-foreground">Descripción:</span>
          <p className="text-sm mt-1">
            {debtor.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {formatDate(debtor.created_at)}
          </span>
        </div>
        <Badge variant="destructive" className="text-xs">
          Pendiente
        </Badge>
      </div>
    </div>
  </motion.div>
);

const DebtorsPage = () => {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest">("recent");
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [debtorToDelete, setDebtorToDelete] = useState<Debtor | null>(null);

  const navigate = useNavigate();

  // Cargar deudores
  useEffect(() => {
    const fetchDebtors = async () => {
      try {
        setLoading(true);
        const data = await getAllDebtors();
        setDebtors(data);
      } catch (error: any) {
        console.error("Error al cargar deudores:", error);
        toast.error(error.response?.data?.message || error.message || "Error al cargar los deudores");
      } finally {
        setLoading(false);
      }
    };

    fetchDebtors();
  }, []);

  // Filtrar y ordenar deudores
  const filteredDebtors = debtors.filter((debtor) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      debtor.description?.toLowerCase().includes(searchLower) ||
      debtor.workOrder?.work_order_id?.toString().includes(searchLower) ||
      debtor.workOrder?.vehicle?.license_plate?.toLowerCase().includes(searchLower) ||
      debtor.workOrder?.vehicle?.owner?.name?.toLowerCase().includes(searchLower) ||
      debtor.workOrder?.vehicle?.company?.name?.toLowerCase().includes(searchLower)
    );
  });

  const sortedDebtors = [...filteredDebtors].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === "recent" ? dateB - dateA : dateA - dateB;
  });

  const visibleDebtors = sortedDebtors.slice(0, visibleCount);

  // Manejar eliminación
  const handleDeleteDebtor = async () => {
    if (!debtorToDelete) return;

    try {
      await deleteDebtor(debtorToDelete.debtor_id);
      setDebtors(prev => prev.filter(d => d.debtor_id !== debtorToDelete.debtor_id));
      toast.success("Deudor eliminado correctamente");
    } catch (error: any) {
      console.error("Error al eliminar deudor:", error);
      toast.error(error.response?.data?.message || error.message || "Error al eliminar el deudor");
    } finally {
      setShowDeleteDialog(false);
      setDebtorToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Cargando deudores...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                Gestión de Deudores
              </h1>
              <p className="text-muted-foreground mt-1">
                Control de pagos pendientes y órdenes de trabajo
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm text-muted-foreground">
                  Total: <span className="font-semibold">{sortedDebtors.length}</span>
                </span>
                <span className="text-sm text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Pendientes de cobro
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={() => navigate("/admin/finanzas/deudores/nuevo")}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Deudor
          </Button>
        </div>
      </div>

      {/* Controles de filtros */}
      <div className="bg-card rounded-xl shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Buscar por descripción, orden de trabajo, patente o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Ordenar:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "recent" | "oldest")}
                className="border rounded px-3 py-2 text-sm bg-background"
              >
                <option value="recent">Más recientes</option>
                <option value="oldest">Más antiguos</option>
              </select>
            </div>

            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 px-3"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "card" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("card")}
                className="h-8 px-3"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <AnimatePresence mode="wait">
        {viewMode === "table" ? (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-card rounded-xl shadow-sm border overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden de Trabajo</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleDebtors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center space-y-3">
                        <FileX className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground text-lg">
                          No se encontraron deudores
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {searchTerm ? "Intenta ajustar los filtros de búsqueda" : "Agrega un nuevo deudor para comenzar"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleDebtors.map((debtor) => (
                    <TableRow key={debtor.debtor_id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-lg text-sm font-medium">
                            #{debtor.workOrder?.work_order_id || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {debtor.workOrder?.vehicle?.license_plate || "Sin vehículo"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span>
                          {debtor.workOrder?.vehicle?.owner?.name ||
                            debtor.workOrder?.vehicle?.company?.name || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate text-muted-foreground" title={debtor.description}>
                          {debtor.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(debtor.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="text-xs">
                          Pendiente
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/finanzas/deudores/editar/${debtor.debtor_id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDebtorToDelete(debtor);
                              setShowDeleteDialog(true);
                            }}
                            className="hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {visibleDebtors.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 space-y-4">
                <FileX className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-xl font-semibold">
                  No se encontraron deudores
                </h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {searchTerm
                    ? "No hay deudores que coincidan con tu búsqueda. Intenta ajustar los filtros."
                    : "Aún no hay deudores registrados. Agrega uno nuevo para comenzar."
                  }
                </p>
                <Button
                  onClick={() => navigate("/admin/finanzas/deudores/nuevo")}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar primer deudor
                </Button>
              </div>
            ) : (
              visibleDebtors.map((debtor) => (
                <DebtorCard
                  key={debtor.debtor_id}
                  debtor={debtor}
                  onEdit={(id) => navigate(`/admin/finanzas/deudores/editar/${id}`)}
                  onDelete={(debtor) => {
                    setDebtorToDelete(debtor);
                    setShowDeleteDialog(true);
                  }}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón cargar más */}
      {visibleCount < sortedDebtors.length && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="px-6 py-2"
          >
            Cargar más deudores ({sortedDebtors.length - visibleCount} restantes)
          </Button>
        </div>
      )}

      {/* Estado vacío cuando no hay deudores */}
      {sortedDebtors.length === 0 && !searchTerm && (
        <div className="bg-card rounded-xl shadow-sm border p-12">
          <div className="text-center">
            <FileX className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">
              No hay deudores registrados
            </h3>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              Aún no hay deudores en el sistema. Comienza agregando el primer deudor.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => navigate("/admin/finanzas/deudores/nuevo")}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <Plus className="h-5 w-5 mr-2" />
                Agregar primer deudor
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas eliminar este deudor? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDebtor}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DebtorsPage;
