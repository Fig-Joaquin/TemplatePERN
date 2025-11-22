"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, Table as TableIcon, LayoutGrid, Plus, Edit, Trash2, FileX, Calendar, User, CreditCard, AlertTriangle, DollarSign, ExternalLink, Car, Building2, Phone } from "lucide-react";
import { toast } from "react-toastify";
import { getAllDebtors, deleteDebtor, processPayment } from "@/services/debtorService";
import { fetchPaymentTypes } from "@/services/work/paymentType";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "@/utils/formDate";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { formatChileanPhone, getFullName, getCurrentMileage } from "@/utils/formatPhone";
import { useNavigate } from "react-router-dom";
import { usePaymentContext } from "@/contexts/PaymentContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Debtor, PaymentType } from "@/types/interfaces";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Función para calcular el porcentaje de pago
const calculatePaymentPercentage = (paid: number = 0, total: number = 0): number => {
  if (total <= 0) return 0;
  return Math.round((paid / total) * 100);
};

// Función para obtener el estado de la deuda
const getDebtStatus = (status: string = "pendiente"): {
  variant: "destructive" | "secondary" | "default",
  label: string
} => {
  switch (status) {
    case "pagado":
      return { variant: "default", label: "Pagado" };
    case "parcial":
      return { variant: "secondary", label: "Parcial" };
    default:
      return { variant: "destructive", label: "Pendiente" };
  }
};

// Componente DebtorCard optimizado
const DebtorCard = ({ debtor, onEdit, onDelete, onPay }: {
  debtor: Debtor;
  onEdit: (id: number) => void;
  onDelete: (debtor: Debtor) => void;
  onPay: (debtor: Debtor) => void;
}) => {
  const totalAmount = Number(debtor.total_amount) || 0;
  const paidAmount = Number(debtor.paid_amount) || 0;
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const paymentPercentage = calculatePaymentPercentage(paidAmount, totalAmount);
  const debtStatus = getDebtStatus(debtor.payment_status);

  return (
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
          {debtor.payment_status !== "pagado" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPay(debtor)}
              className="hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/30"
            >
              <DollarSign className="h-4 w-4" />
            </Button>
          )}
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

        {/* Información financiera */}
        {totalAmount > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Total:</span>
              <span className="font-semibold">{formatPriceCLP(totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Pagado:</span>
              <span className="text-green-600 dark:text-green-400">{formatPriceCLP(paidAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Restante:</span>
              <span className="text-red-600 dark:text-red-400">{formatPriceCLP(remainingAmount)}</span>
            </div>

            {/* Barra de progreso */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progreso de pago</span>
                <span>{paymentPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${paymentPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatDate(debtor.created_at)}
            </span>
          </div>
          <Badge variant={debtStatus.variant} className="text-xs">
            {debtStatus.label}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
};

const DebtorsPage = () => {
  const navigate = useNavigate();
  const { refreshPayments } = usePaymentContext();
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest">("recent");
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [debtorToDelete, setDebtorToDelete] = useState<Debtor | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState<boolean>(false);
  const [debtorToPay, setDebtorToPay] = useState<Debtor | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>("");
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);

  // Estados para diálogos de información
  const [showVehicleDialog, setShowVehicleDialog] = useState<boolean>(false);
  const [showClientDialog, setShowClientDialog] = useState<boolean>(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Función para cargar deudores
  const fetchDebtors = async () => {
    try {
      setLoading(true);
      const debtorsData = await getAllDebtors();
      console.log("Datos de deudores cargados:", debtorsData); // Debug
      setDebtors(debtorsData);
    } catch (error: any) {
      console.error("Error al cargar deudores:", error);
      toast.error(error.response?.data?.message || error.message || "Error al cargar los deudores");
    } finally {
      setLoading(false);
    }
  };

  // Cargar deudores y tipos de pago
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [debtorsData, paymentTypesData] = await Promise.all([
          getAllDebtors(),
          fetchPaymentTypes()
        ]);
        console.log("Datos de deudores en useEffect:", debtorsData); // Debug
        console.log("Primer deudor completo:", debtorsData[0]); // Debug detallado
        setDebtors(debtorsData);
        setPaymentTypes(paymentTypesData);
      } catch (error: any) {
        console.error("Error al cargar datos:", error);
        toast.error(error.response?.data?.message || error.message || "Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      const response = await deleteDebtor(debtorToDelete.debtor_id);

      // Remover el deudor de la lista local (independientemente de si fue marcado como pagado o eliminado)
      setDebtors(prev => prev.filter(d => d.debtor_id !== debtorToDelete.debtor_id));

      // Mostrar mensaje apropiado según la acción realizada
      if (response?.data?.action === "marked_as_paid") {
        toast.success("Deudor marcado como pagado exitosamente");
      } else if (response?.data?.action === "deleted_permanently") {
        toast.success("Deudor eliminado exitosamente");
      } else {
        toast.success("Deudor procesado correctamente");
      }

      fetchDebtors(); // Refrescar los datos
    } catch (error: any) {
      console.error("Error al eliminar deudor:", error);

      // Mostrar mensaje de error más específico
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Error al procesar la eliminación del deudor");
      }
    } finally {
      setShowDeleteDialog(false);
      setDebtorToDelete(null);
    }
  };

  // Manejar pago
  const handlePayment = async () => {
    if (!debtorToPay || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Ingrese un monto válido");
      return;
    }

    // Validar que no se exceda el monto restante
    if (debtorToPay.total_amount && Number(debtorToPay.total_amount) > 0) {
      const totalAmount = Number(debtorToPay.total_amount);
      const paidAmount = Number(debtorToPay.paid_amount) || 0;
      const remainingAmount = totalAmount - paidAmount;

      if (amount > remainingAmount) {
        toast.error(`El monto no puede ser mayor al restante: ${formatPriceCLP(remainingAmount)}`);
        return;
      }
    }

    try {
      setProcessingPayment(true);
      const paymentData: any = {
        payment_amount: amount
      };

      // Agregar tipo de pago si está seleccionado
      if (selectedPaymentType) {
        paymentData.payment_type_id = parseInt(selectedPaymentType);
      }

      const result = await processPayment(debtorToPay.debtor_id, paymentData);

      // Actualizar la lista de deudores
      setDebtors(prev => prev.map(d =>
        d.debtor_id === debtorToPay.debtor_id ? result.debtor : d
      ));

      toast.success(
        `Pago procesado: ${formatPriceCLP(amount)}. ${result.payment_details.percentage_paid === 100
          ? "¡Deuda completamente pagada!"
          : `Restante: ${formatPriceCLP(result.payment_details.remaining || 0)}`
        }${result.work_payment ? " - ¡Pago de cliente registrado!" : ""}`
      );

      setShowPaymentDialog(false);
      setDebtorToPay(null);
      setPaymentAmount("");
      setSelectedPaymentType("");
      fetchDebtors(); // Refrescar los datos
      refreshPayments(); // Notificar al dashboard para que se actualice
    } catch (error: any) {
      console.error("Error al procesar pago:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Error al procesar el pago");
      }
    } finally {
      setProcessingPayment(false);
    }
  };

  // Validar si el monto de pago excede el restante
  const isPaymentAmountValid = () => {
    if (!paymentAmount || !debtorToPay) return true;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return false;

    if (debtorToPay.total_amount && Number(debtorToPay.total_amount) > 0) {
      const totalAmount = Number(debtorToPay.total_amount);
      const paidAmount = Number(debtorToPay.paid_amount) || 0;
      const remainingAmount = totalAmount - paidAmount;

      return amount <= remainingAmount;
    }

    return true;
  };

  // Funciones para manejar clics en elementos
  const handleWorkOrderClick = (debtor: any) => {
    const workOrderId = debtor.workOrder?.work_order_id;
    if (workOrderId) {
      navigate(`/admin/orden-trabajo/editar/${workOrderId}`);
    } else {
      toast.error("No se encontró la orden de trabajo");
    }
  };

  const handleVehicleClick = (debtor: any) => {
    setSelectedVehicle(debtor);
    setShowVehicleDialog(true);
  };

  const handleClientClick = (debtor: any) => {
    setSelectedClient(debtor);
    setShowClientDialog(true);
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
                  <TableHead>Monto / Pagado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleDebtors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
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
                  visibleDebtors.map((debtor) => {
                    const totalAmount = Number(debtor.total_amount) || 0;
                    const paidAmount = Number(debtor.paid_amount) || 0;
                    const debtStatus = getDebtStatus(debtor.payment_status);

                    return (
                      <TableRow key={debtor.debtor_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleWorkOrderClick(debtor)}
                              className="flex items-center space-x-1 text-black-800 dark:text-black-800 text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                            >
                              <span>#{debtor.workOrder?.work_order_id || "N/A"}</span>
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleVehicleClick(debtor)}
                            className="flex items-center space-x-1 font-medium hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                          >
                            <Car className="h-4 w-4" />
                            <span>{debtor.workOrder?.vehicle?.license_plate || "Sin vehículo"}</span>
                          </button>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleClientClick(debtor)}
                            className="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                          >
                            {debtor.workOrder?.vehicle?.company ? (
                              <Building2 className="h-4 w-4" />
                            ) : (
                              <Phone className="h-4 w-4" />
                            )}
                            <span>
                              {debtor.workOrder?.vehicle?.owner
                                ? getFullName(debtor.workOrder.vehicle.owner)
                                : debtor.workOrder?.vehicle?.company?.name || "N/A"}
                            </span>
                          </button>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate text-muted-foreground" title={debtor.description}>
                            {debtor.description}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {totalAmount > 0 ? (
                              <>
                                <div className="text-sm">
                                  <span className="font-medium">{formatPriceCLP(totalAmount)}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Pagado: <span className="text-green-600 dark:text-green-400">{formatPriceCLP(paidAmount)}</span>
                                </div>
                                {totalAmount > 0 && (
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                                    <div
                                      className="bg-green-500 h-1 rounded-full"
                                      style={{ width: `${calculatePaymentPercentage(paidAmount, totalAmount)}%` }}
                                    ></div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">Monto no definido</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={debtStatus.variant} className="text-xs">
                            {debtStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(debtor.created_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center space-x-2">
                            {debtor.payment_status !== "pagado" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setDebtorToPay(debtor);
                                  setShowPaymentDialog(true);
                                }}
                                className="hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/30"
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            )}
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
                    );
                  })
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
              <motion.div 
                className="col-span-full flex flex-col items-center justify-center py-16 space-y-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-muted/50 rounded-full p-8 mb-2">
                  <FileX className="w-24 h-24 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground">
                  No se encontraron deudores
                </h2>
                <p className="text-muted-foreground text-center max-w-md">
                  {searchTerm
                    ? "No hay deudores que coincidan con tu búsqueda. Intenta ajustar los filtros."
                    : "Aún no hay deudores registrados. Los deudores se crean desde las órdenes de trabajo."
                  }
                </p>
                <Button
                  onClick={() => navigate("/admin/ordenes-trabajo")}
                  className="flex items-center gap-2 mt-2"
                >
                  <FileX className="w-4 h-4" />
                  Ver Órdenes de Trabajo
                </Button>
              </motion.div>
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
                  onPay={(debtor) => {
                    setDebtorToPay(debtor);
                    setShowPaymentDialog(true);
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

      {/* Dialog de pago */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {debtorToPay && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Orden de Trabajo:</span>
                  <span>#{debtorToPay.workOrder?.work_order_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Cliente:</span>
                  <span>{debtorToPay.workOrder?.vehicle?.owner?.name || debtorToPay.workOrder?.vehicle?.company?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Vehículo:</span>
                  <span>{debtorToPay.workOrder?.vehicle?.license_plate || "N/A"}</span>
                </div>
                {debtorToPay.total_amount && Number(debtorToPay.total_amount) > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Total deuda:</span>
                      <span>{formatPriceCLP(Number(debtorToPay.total_amount))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Ya pagado:</span>
                      <span className="text-green-600 dark:text-green-400">
                        {formatPriceCLP(Number(debtorToPay.paid_amount) || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Restante:</span>
                      <span className="text-red-600 dark:text-red-400">
                        {formatPriceCLP(Number(debtorToPay.total_amount) - (Number(debtorToPay.paid_amount) || 0))}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="payment-amount">Monto a pagar</Label>
              {debtorToPay && debtorToPay.total_amount && Number(debtorToPay.total_amount) > 0 && (
                <p className="text-xs text-muted-foreground mb-2">
                  Máximo permitido: {formatPriceCLP(Number(debtorToPay.total_amount) - (Number(debtorToPay.paid_amount) || 0))}
                </p>
              )}
              <Input
                id="payment-amount"
                type="number"
                placeholder="Ingrese el monto"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                min="0.01"
                max={debtorToPay && debtorToPay.total_amount && Number(debtorToPay.total_amount) > 0
                  ? (Number(debtorToPay.total_amount) - (Number(debtorToPay.paid_amount) || 0)).toString()
                  : undefined}
                step="0.01"
                className={!isPaymentAmountValid() ? "border-red-500" : ""}
              />
              {paymentAmount && !isPaymentAmountValid() && (
                <p className="text-xs text-red-500 mt-1">
                  {debtorToPay && debtorToPay.total_amount && Number(debtorToPay.total_amount) > 0
                    ? `El monto no puede ser mayor a ${formatPriceCLP(Number(debtorToPay.total_amount) - (Number(debtorToPay.paid_amount) || 0))}`
                    : "Ingrese un monto válido"
                  }
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="payment-type">Tipo de pago (opcional)</Label>
              <Select value={selectedPaymentType} onValueChange={setSelectedPaymentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo de pago (por defecto: Pago de Deuda)" />
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentDialog(false);
                setDebtorToPay(null);
                setPaymentAmount("");
                setSelectedPaymentType("");
              }}
              disabled={processingPayment}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePayment}
              disabled={processingPayment || !paymentAmount || !isPaymentAmountValid()}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingPayment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Registrar Pago
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">¡Advertencia! Eliminación Permanente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center font-medium text-foreground">¿Estás seguro de eliminar este deudor?</p>
            {debtorToDelete && (
              <div className="bg-muted border border-border rounded-md p-3 text-sm">
                <p className="text-foreground"><strong>Deudor:</strong> {debtorToDelete.description}</p>
                <p className="text-foreground"><strong>Orden:</strong> #{debtorToDelete.workOrder?.work_order_id}</p>
                <p className="text-foreground"><strong>Monto total:</strong> {formatPriceCLP(Number(debtorToDelete.total_amount) || 0)}</p>
                {debtorToDelete.paid_amount && Number(debtorToDelete.paid_amount) > 0 && (
                  <p className="text-foreground"><strong>Monto pagado:</strong> {formatPriceCLP(Number(debtorToDelete.paid_amount))}</p>
                )}
              </div>
            )}
            <div className="bg-accent/10 border border-accent/20 rounded-md p-3 text-sm">
              <p className="text-foreground"><strong>ATENCIÓN:</strong> Esta acción realizará lo siguiente:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-foreground">
                {(debtorToDelete?.paid_amount && Number(debtorToDelete.paid_amount) > 0) ? (
                  <>
                    <li>El deudor será marcado como "pagado completo"</li>
                    <li>No aparecerá más en la lista de deudores pendientes</li>
                    <li>Los registros de pagos se mantendrán para auditoría</li>
                  </>
                ) : (
                  <>
                    <li>El deudor será eliminado completamente del registro</li>
                    <li>Se perderán todos los datos asociados</li>
                    <li>No habrá respaldo de la información</li>
                  </>
                )}
              </ul>
              <p className="mt-2 font-semibold text-foreground">Esta acción no se puede deshacer.</p>
            </div>
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteDebtor}>
              {(debtorToDelete?.paid_amount && Number(debtorToDelete.paid_amount) > 0)
                ? "Marcar como Pagado"
                : "Eliminar permanentemente"
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de información de vehículo */}
      <Dialog open={showVehicleDialog} onOpenChange={setShowVehicleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Car className="h-5 w-5" />
              <span>Información del Vehículo</span>
            </DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Patente:</label>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedVehicle.workOrder?.vehicle?.license_plate || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Marca y Modelo:</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedVehicle.workOrder?.vehicle?.model?.brand?.brand_name || "Sin marca"} {selectedVehicle.workOrder?.vehicle?.model?.model_name || "Sin modelo"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Año:</label>
                  <p className="text-sm text-muted-foreground">{selectedVehicle.workOrder?.vehicle?.year || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Color:</label>
                  <p className="text-sm text-muted-foreground">{selectedVehicle.workOrder?.vehicle?.color || "N/A"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Estado:</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedVehicle.workOrder?.vehicle?.vehicle_status === "running" ? "Funcionando" : "Averiado"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">ID del Vehículo:</label>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedVehicle.workOrder?.vehicle?.vehicle_id || "N/A"}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Propietario:</label>
                <p className="text-sm text-muted-foreground">
                  {getFullName(selectedVehicle.workOrder?.vehicle?.owner) !== "N/A"
                    ? getFullName(selectedVehicle.workOrder?.vehicle?.owner)
                    : selectedVehicle.workOrder?.vehicle?.company?.name || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Kilometraje Actual:</label>
                <p className="text-sm text-muted-foreground font-mono">
                  {getCurrentMileage(selectedVehicle.workOrder?.vehicle?.mileage_history)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowVehicleDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de información de cliente */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedClient?.workOrder?.vehicle?.company ? (
                <Building2 className="h-5 w-5" />
              ) : (
                <Phone className="h-5 w-5" />
              )}
              <span>Información del Cliente</span>
            </DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              {selectedClient.workOrder?.vehicle?.owner ? (
                // Persona natural
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Nombre Completo:</label>
                    <p className="text-sm text-muted-foreground">
                      {getFullName(selectedClient.workOrder.vehicle.owner)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">RUT:</label>
                      <p className="text-sm text-muted-foreground font-mono">
                        {selectedClient.workOrder.vehicle.owner.rut || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Teléfono:</label>
                      <p className="text-sm text-muted-foreground">
                        {formatChileanPhone(selectedClient.workOrder.vehicle.owner.number_phone)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email:</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedClient.workOrder.vehicle.owner.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Dirección:</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedClient.workOrder.vehicle.owner.address || "N/A"}
                    </p>
                  </div>
                </div>
              ) : selectedClient.workOrder?.vehicle?.company ? (
                // Empresa
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Empresa:</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedClient.workOrder.vehicle.company.name}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">RUT:</label>
                      <p className="text-sm text-muted-foreground font-mono">
                        {selectedClient.workOrder.vehicle.company.rut || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Teléfono:</label>
                      <p className="text-sm text-muted-foreground">
                        {formatChileanPhone(selectedClient.workOrder.vehicle.company.phone)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email:</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedClient.workOrder.vehicle.company.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Dirección:</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedClient.workOrder.vehicle.company.address || "N/A"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay información del cliente disponible</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowClientDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DebtorsPage;
