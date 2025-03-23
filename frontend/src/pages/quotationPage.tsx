"use client"

import { useEffect, useState } from "react"
import type { Quotation, WorkProductDetail } from "@/types/interfaces"
import { fetchQuotations, deleteQuotation, downloadQuotationPDF } from "@/services/quotationService"
import { getWorkProductDetailsByQuotationId } from "@/services/workProductDetail"
import { DataTable } from "@/components/data-table"
import { columns } from "@/components/columns"
import { Toast } from "@/components/ui/toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPriceCLP } from "@/utils/formatPriceCLP"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/utils/formDate"
import { VehicleCard } from "@/components/VehicleCard"
import { FileText, Plus, Edit } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { motion } from "framer-motion"

export default function QuotationPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [workProductDetails, setWorkProductDetails] = useState<WorkProductDetail[]>([])
  const navigate = useNavigate()

  // First, add a state for controlling the delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quotationToDelete, setQuotationToDelete] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetchQuotations()
        setQuotations(response)

        const detailsPromises = response.map((q) => getWorkProductDetailsByQuotationId(q.quotation_id!))
        const detailsResults = await Promise.all(detailsPromises)
        const allDetails = detailsResults.flat()
        setWorkProductDetails(allDetails)
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
        const response = await fetchQuotations();
        setQuotations(response);
        toast.success("Cotización eliminada exitosamente");
      } catch (error) {
        console.error("Error al eliminar la cotización:", error);
        toast.error("Error al eliminar la cotización");
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
  }))

  const updatedColumns = columns.map((col) => {
    if (col.id === "actions") {
      return {
        ...col,
        cell: ({ row }: { row: { original: Quotation & { details: WorkProductDetail[] } } }) => {
          const quotation = row.original
          return (
            <div className="flex space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Ver detalles</Button>
                </DialogTrigger>
                <DialogContent className="bg-card text-card-foreground max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Detalles de la Cotización</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-bold mb-2">Información de la cotización</h4>
                      <p>ID: {quotation.quotation_id}</p>
                      <p>Descripción: {quotation.description}</p>
                      <p>Estado: {quotation.quotation_status}</p>
                      <p>Fecha de entrada: {quotation.entry_date ? formatDate(quotation.entry_date) : ""}</p>
                      <p>Precio Total: {formatPriceCLP(Number(quotation.total_price))}</p>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">Información del vehículo</h4>
                      <VehicleCard vehicle={quotation.vehicle} />
                    </div>
                    <div className="col-span-2">
                      <h4 className="font-bold mb-2">Detalles de productos</h4>
                      <ScrollArea className="h-[300px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead>Cantidad</TableHead>
                              <TableHead>Precio Unitario</TableHead>
                              <TableHead>Mano de Obra</TableHead>
                              <TableHead>Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {quotation.details.map((detail, index) => {
                              // Get tax rate from detail
                              const taxRate = Number(detail.tax?.tax_rate || 0) / 100;
                              // Get profit margin from product
                              const profitMargin = Number(detail.product?.profit_margin || 0) / 100;

                              // Calculate base price with profit margin
                              const priceWithMargin = Number(detail.product?.sale_price || 0) * (1 + profitMargin);

                              // Calculate subtotal before tax (including quantity and labor)
                              const subtotalBeforeTax = (priceWithMargin * detail.quantity) + Number(detail.labor_price || 0);

                              // Calculate final price with tax
                              const finalPrice = subtotalBeforeTax * (1 + taxRate);

                              return (
                                <TableRow key={index}>
                                  <TableCell>{detail.product?.product_name ?? "N/A"}</TableCell>
                                  <TableCell>{detail.quantity}</TableCell>
                                  <TableCell>{formatPriceCLP(priceWithMargin)}</TableCell>
                                  <TableCell>{formatPriceCLP(Number(detail.labor_price))}</TableCell>
                                  <TableCell>
                                    {formatPriceCLP(finalPrice)}
                                    <span className="text-xs text-gray-500 block">(IVA incluido)</span>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            <TableRow className="font-bold bg-muted/50">
                              <TableCell colSpan={4} className="text-right">Total con IVA:</TableCell>
                              <TableCell>
                                {formatPriceCLP(
                                  quotation.details.reduce((total, detail) => {
                                    const profitMargin = Number(detail.product?.profit_margin || 0) / 100;
                                    const taxRate = Number(detail.tax?.tax_rate || 0) / 100;
                                    const priceWithMargin = Number(detail.product?.sale_price || 0) * (1 + profitMargin);
                                    const subtotalBeforeTax = (priceWithMargin * detail.quantity) + Number(detail.labor_price || 0);
                                    return total + (subtotalBeforeTax * (1 + taxRate));
                                  }, 0)
                                )}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          await downloadQuotationPDF(quotation.quotation_id!);
                        } catch (error) {
                          toast.error("Error al descargar el PDF");
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
              <Button 
                variant="outline" 
                className="flex items-center"
                onClick={() => navigate(`/admin/cotizaciones/editar/${quotation.quotation_id}`)}
              >
                <Edit className="w-4 h-4 mr-2" />
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
          <DataTable columns={updatedColumns} data={data} />
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

