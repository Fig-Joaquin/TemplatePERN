"use client"

import { useEffect, useState } from "react"
import type { Quotation, WorkProductDetail, QuotationStatus } from "@/types/interfaces"
import { fetchQuotations, deleteQuotation, downloadQuotationPDF, updateQuotationStatus } from "@/services/quotationService"
import { getWorkProductDetailsByQuotationId } from "@/services/workProductDetail"
import { getServicesByQuotation } from "@/services/serviceApi"
import type { QuotationServiceDetail } from "@/types/service"
import { DataTable } from "@/components/data-table"
import { columns } from "@/components/columns"
import { Toast } from "@/components/ui/toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPriceCLP } from "@/utils/formatPriceCLP"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/utils/formDate"
import { VehicleCard } from "@/components/VehicleCard"
import { FileText, Plus, Edit, Search, CheckCircle, XCircle, Clock, ArrowRightLeft, Filter, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function QuotationPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [workProductDetails, setWorkProductDetails] = useState<WorkProductDetail[]>([])
  const [quotationServices, setQuotationServices] = useState<QuotationServiceDetail[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const navigate = useNavigate()

  // First, add a state for controlling the delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quotationToDelete, setQuotationToDelete] = useState<number | null>(null)

  // Estado para manejar la actualización de estado
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null)

  // Helper function to translate status - vamos a modificar esto para que también devuelva la variante
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { label: 'Aprobada', variant: 'success', className: 'bg-[#16a34a] text-white border-[#16a34a]' };
      case 'rejected':
        return { label: 'Rechazada', variant: 'destructive', className: 'bg-[#ef4444] text-white border-[#ef4444]' };
      case 'pending':
        return { label: 'Pendiente', variant: 'warning', className: 'bg-[#fbbf24] text-white border-[#fbbf24]' };
      default:
        return { label: status, variant: 'default', className: '' };
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetchQuotations([])
        setQuotations(response)

        const [detailsResults, servicesResults] = await Promise.all([
          Promise.all(response.map((q) => getWorkProductDetailsByQuotationId(q.quotation_id!))),
          Promise.all(response.map((q) => getServicesByQuotation(q.quotation_id!))),
        ])
        setWorkProductDetails(detailsResults.flat())
        setQuotationServices(servicesResults.flat())
      } catch (error) {
        console.error("Error al obtener las cotizaciones:", error)
        Toast({
          title: "Error: No se pudieron obtener las cotizaciones",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Función para cambiar el estado de la cotización
  const handleStatusChange = async (quotationId: number, newStatus: QuotationStatus) => {
    setUpdatingStatusId(quotationId)
    try {
      const result = await updateQuotationStatus(quotationId, newStatus)

      // Actualizar el estado local de las cotizaciones
      setQuotations(prevQuotations =>
        prevQuotations.map(q =>
          q.quotation_id === quotationId
            ? { ...q, quotation_status: newStatus }
            : q
        )
      )

      // Mostrar mensaje de éxito
      if (newStatus === 'approved' && result.workOrder) {
        toast.success(`Cotización aprobada y orden de trabajo #${result.workOrder.work_order_id} creada automáticamente`)
      } else {
        toast.success(result.message)
      }
    } catch (error: any) {
      console.error("Error al actualizar el estado:", error)
      const errorMessage = error.response?.data?.message || "Error al actualizar el estado de la cotización"
      toast.error(errorMessage)
    } finally {
      setUpdatingStatusId(null)
    }
  }

  // Then modify the deleteQuotation handling
  const handleDeleteClick = (quotationId: number) => {
    setQuotationToDelete(quotationId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (quotationToDelete) {
      try {
        await deleteQuotation(quotationToDelete);
        // Refresh the quotations list
        const response = await fetchQuotations([]);
        setQuotations(response);
        toast.success("Cotización eliminada exitosamente");
      } catch (error: any) {
        console.error("Error al eliminar la cotización:", error);
        const errorMessage = error.response?.data?.message || "Error al eliminar la cotización";
        toast.error(errorMessage);
      } finally {
        setDeleteDialogOpen(false)
        setQuotationToDelete(null)
      }
    }
  }

  const data = quotations.map((quotation) => ({
    ...quotation,
    totalPrice: quotation.total_price || 0,
    details: workProductDetails.filter((detail) => detail.quotation_id === quotation.quotation_id),
    services: quotationServices.filter((s) => s.quotation_id === quotation.quotation_id),
  }))

  // Función de filtrado: estado + rango de fechas + texto libre
  const filteredData = data.filter((quotation) => {
    // Filtro por estado
    if (statusFilter !== "all" && quotation.quotation_status !== statusFilter) return false;

    // Filtro por rango de fechas
    if (dateFrom || dateTo) {
      const entryDate = quotation.entry_date ? new Date(quotation.entry_date) : null;
      if (!entryDate) return false;
      if (dateFrom && entryDate < new Date(dateFrom)) return false;
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (entryDate > toDate) return false;
      }
    }

    // Filtro por texto (patente, nombre, teléfono)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();

      // Buscar por patente del vehículo
      const licensePlate = quotation.vehicle?.license_plate?.toLowerCase() || '';
      if (licensePlate.includes(searchLower)) return true;

      // Buscar por nombre del dueño (concatenar nombre + apellidos)
      const owner = quotation.vehicle?.owner;
      if (owner) {
        const fullName = `${owner.name} ${owner.first_surname} ${owner.second_surname || ''}`.toLowerCase();
        if (fullName.includes(searchLower)) return true;
      }

      // Buscar por nombre de la empresa
      const company = quotation.vehicle?.company;
      if (company?.name?.toLowerCase().includes(searchLower)) return true;

      // Buscar por teléfono del dueño
      const ownerPhone = owner?.number_phone?.toLowerCase() || '';
      if (ownerPhone.includes(searchLower)) return true;

      // Buscar por teléfono de la empresa
      const companyPhone = company?.phone?.toLowerCase() || '';
      if (companyPhone.includes(searchLower)) return true;

      return false;
    }

    return true;
  });

  const updatedColumns = columns.map((col) => {
    if (col.id === "actions") {
      return {
        ...col,
        cell: ({ row }: { row: { original: Quotation & { details: WorkProductDetail[]; services: QuotationServiceDetail[] } } }) => {
          const quotation = row.original
          return (
            <div className="flex items-center justify-end gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Ver detalles</Button>
                </DialogTrigger>
                <DialogContent className="bg-card text-card-foreground max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Detalles de la Cotización</DialogTitle>
                  </DialogHeader>

                  {/* Contenido principal con scroll */}
                  <div className="overflow-y-auto flex-1 pr-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-bold mb-2">Información de la cotización</h4>
                        <p>ID: {quotation.quotation_id}</p>
                        <p>Descripción: {quotation.description}</p>
                        <p>Estado: <Badge className={getStatusBadge(quotation.quotation_status).className}>
                          {getStatusBadge(quotation.quotation_status).label}
                        </Badge></p>
                        <p>Fecha de entrada: {quotation.entry_date ? formatDate(quotation.entry_date) : ""}</p>
                        <p>Precio Total: {formatPriceCLP(Number(quotation.total_price))}</p>
                      </div>
                      <div>
                        <h4 className="font-bold mb-2">Información del vehículo</h4>
                        {quotation.vehicle ? (
                          <VehicleCard vehicle={quotation.vehicle} />
                        ) : (
                          <div className="text-muted-foreground">Sin vehículo asignado</div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <h4 className="font-bold mb-2">Productos y Servicios</h4>
                        <ScrollArea className="h-[300px]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Producto / Servicio</TableHead>
                                <TableHead>Cantidad</TableHead>
                                <TableHead>Precio Unitario</TableHead>
                                <TableHead>Mano de Obra</TableHead>
                                <TableHead>Subtotal</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {/* Filas de productos */}
                              {quotation.details.map((detail, index) => {
                                const taxRate = Number(detail.applied_tax_rate ?? detail.tax?.tax_rate ?? 19) / 100;
                                const profitMargin = Number(detail.product?.profit_margin || 0) / 100;
                                const priceWithMargin = Number(detail.product?.sale_price || 0) * (1 + profitMargin);
                                const subtotalBeforeTax = (priceWithMargin * detail.quantity) + Number(detail.labor_price || 0);
                                const finalPrice = subtotalBeforeTax * (1 + taxRate);
                                return (
                                  <TableRow key={`prod-${index}`}>
                                    <TableCell>
                                      <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded mr-2">Producto</span>
                                      {detail.product?.product_name ?? "N/A"}
                                    </TableCell>
                                    <TableCell>{detail.quantity}</TableCell>
                                    <TableCell>{formatPriceCLP(priceWithMargin)}</TableCell>
                                    <TableCell>{formatPriceCLP(Number(detail.labor_price))}</TableCell>
                                    <TableCell>
                                      {formatPriceCLP(finalPrice)}
                                      <span className="text-xs text-gray-500 block">(IVA {taxRate * 100}% incluido)</span>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                              {/* Filas de servicios */}
                              {quotation.services?.map((svc, index) => {
                                const taxRate = Number(quotation.tax_rate ?? 19) / 100;
                                const subtotalBeforeTax = Number(svc.precio_unitario) * svc.cantidad;
                                const finalPrice = subtotalBeforeTax * (1 + taxRate);
                                return (
                                  <TableRow key={`svc-${index}`}>
                                    <TableCell>
                                      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded mr-2">Servicio</span>
                                      {svc.service?.service_name ?? "N/A"}
                                    </TableCell>
                                    <TableCell>{svc.cantidad}</TableCell>
                                    <TableCell>{formatPriceCLP(Number(svc.precio_unitario))}</TableCell>
                                    <TableCell>—</TableCell>
                                    <TableCell>
                                      {formatPriceCLP(finalPrice)}
                                      <span className="text-xs text-gray-500 block">(IVA {taxRate * 100}% incluido)</span>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                              {/* Fila total */}
                              <TableRow className="font-bold bg-muted/50">
                                <TableCell colSpan={4} className="text-right">Total con IVA:</TableCell>
                                <TableCell>
                                  {formatPriceCLP(
                                    quotation.details.reduce((total, detail) => {
                                      const profitMargin = Number(detail.product?.profit_margin || 0) / 100;
                                      const taxRate = Number(detail.applied_tax_rate ?? detail.tax?.tax_rate ?? 19) / 100;
                                      const priceWithMargin = Number(detail.product?.sale_price || 0) * (1 + profitMargin);
                                      const subtotalBeforeTax = (priceWithMargin * detail.quantity) + Number(detail.labor_price || 0);
                                      return total + (subtotalBeforeTax * (1 + taxRate));
                                    }, 0) +
                                    (quotation.services ?? []).reduce((total, svc) => {
                                      const taxRate = Number(quotation.tax_rate ?? 19) / 100;
                                      return total + (Number(svc.precio_unitario) * svc.cantidad * (1 + taxRate));
                                    }, 0)
                                  )}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </div>
                    </div>
                  </div>

                  {/* Botones siempre visibles al final del modal */}
                  <div className="mt-4 flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          await downloadQuotationPDF(quotation.quotation_id!);
                        } catch (error: any) {
                          toast.error(error.response?.data?.message || error.message || "Error al descargar el PDF");
                        }
                      }}
                    >
                      Descargar PDF
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteClick(quotation.quotation_id!)}
                    >
                      Eliminar Cotización
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Dropdown para cambiar estado */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    disabled={updatingStatusId === quotation.quotation_id}
                  >
                    <ArrowRightLeft className="w-4 h-4 mr-1" />
                    {updatingStatusId === quotation.quotation_id ? "..." : "Estado"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(quotation.quotation_id!, "approved")}
                    disabled={quotation.quotation_status === "approved"}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Aprobar</span>
                    {quotation.quotation_status !== "approved" && (
                      <span className="text-xs text-muted-foreground ml-2">(Crea orden de trabajo)</span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(quotation.quotation_id!, "pending")}
                    disabled={quotation.quotation_status === "pending"}
                    className="flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span>Pendiente</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(quotation.quotation_id!, "rejected")}
                    disabled={quotation.quotation_status === "rejected"}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>Rechazar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                className="flex items-center"
                onClick={() => navigate(`/admin/cotizaciones/editar/${quotation.quotation_id}`)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
            </div>
          )
        },
      }
    }
    return col
  })

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <FileText className="w-8 h-8" />
          Cotizaciones
        </h1>
        <Button onClick={() => navigate("/admin/cotizaciones/nuevo")} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cotización
        </Button>
      </div>

      {/* Panel de filtros */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
          <Filter className="w-4 h-4" />
          Filtros
        </div>
        {/* Todos los controles comparten la misma altura de input; items-end los alinea por la base */}
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Buscador — más ancho que los demás */}
          <div className="flex-[2] min-w-0 flex flex-col gap-1">
            <label htmlFor="search-input" className="text-xs font-medium text-muted-foreground">Buscar</label>
            <div className="relative">
              <Input
                id="search-input"
                type="text"
                placeholder="Patente, nombre del dueño o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 pl-9 pr-9"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filtro por estado */}
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <label htmlFor="status-filter" className="text-xs font-medium text-muted-foreground">Estado</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter" className="h-10">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="approved">Aprobada</SelectItem>
                <SelectItem value="rejected">Rechazada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rango de fechas — etiqueta compartida arriba, inputs en la misma fila */}
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Fecha de entrada</span>
            <div className="flex items-center gap-2">
              <Input
                id="date-from"
                type="date"
                aria-label="Desde"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 flex-1 min-w-0"
              />
              <span className="text-xs text-muted-foreground shrink-0">–</span>
              <Input
                id="date-to"
                type="date"
                aria-label="Hasta"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 flex-1 min-w-0"
              />
            </div>
          </div>
        </div>

        {/* Indicador de filtros activos */}
        {(statusFilter !== "all" || dateFrom || dateTo || searchTerm) && (
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t">
            <span className="text-xs text-muted-foreground">Filtros activos:</span>
            {searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                Búsqueda: "{searchTerm}"
                <button onClick={() => setSearchTerm("")}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {statusFilter !== "all" && (() => {
              const statusLabels: Record<string, string> = { pending: "Pendiente", approved: "Aprobada", rejected: "Rechazada" };
              return (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  Estado: {statusLabels[statusFilter] ?? statusFilter}
                  <button onClick={() => setStatusFilter("all")}><X className="w-3 h-3" /></button>
                </Badge>
              );
            })()}
            {dateFrom && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                Desde: {dateFrom}
                <button onClick={() => setDateFrom("")}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {dateTo && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                Hasta: {dateTo}
                <button onClick={() => setDateTo("")}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            <button
              onClick={() => { setSearchTerm(""); setStatusFilter("all"); setDateFrom(""); setDateTo(""); }}
              className="text-xs text-destructive hover:underline ml-auto"
            >
              Limpiar todo
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Cargando cotizaciones...</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {filteredData.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                No se encontraron cotizaciones con los filtros aplicados
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Intenta ajustar los criterios de búsqueda
              </p>
            </div>
          ) : (
            <DataTable
              columns={updatedColumns}
              data={filteredData}
              initialSorting={[{ id: "quotation_id", desc: true }]}
            />
          )}
        </motion.div>
      )}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <p>¿Estás seguro de eliminar esta cotización?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

