"use client"

import { useEffect, useState } from "react"
import type { Quotation, WorkProductDetail } from "@/types/interfaces"
import { fetchQuotations } from "@/services/quotationService"
import { getWorkProductDetailsByQuotationId } from "@/services/workProductDetail"
import { DataTable } from "@/components/data-table"
import { columns } from "@/components/columns"
import { Toast } from "@/components/ui/toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPriceCLP } from "@/utils/formatPriceCLP"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/utils/formDate" // Import formatDate
import { VehicleCard } from "@/components/VehicleCard" //Import VehicleCard

export default function QuotationPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [workProductDetails, setWorkProductDetails] = useState<WorkProductDetail[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
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
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Ver detalles</Button>
              </DialogTrigger>
              <DialogContent className="bg-card text-card-foreground max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Detalles de la Cotización</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold mb-2">Información de la cotización</h4>
                    <p>ID: {quotation.quotation_id}</p>
                    <p>Descripción: {quotation.description}</p>
                    <p>Estado: {quotation.quotation_Status}</p>
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
                          {quotation.details.map((detail, index) => (
                            <TableRow key={index}>
                              <TableCell>{detail.product?.product_name ?? "N/A"}</TableCell>
                              <TableCell>{detail.quantity}</TableCell>
                              <TableCell>{formatPriceCLP(Number(detail.sale_price))}</TableCell>
                              <TableCell>{formatPriceCLP(Number(detail.labor_price))}</TableCell>
                              <TableCell>
                                {formatPriceCLP(
                                  Number(detail.sale_price) * detail.quantity + Number(detail.labor_price),
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )
        },
      }
    }
    return col
  })

  return (
    <div className="container mx-auto py-10 bg-card">
      {" "}
      {/* Update 1 */}
      <h2 className="text-3xl font-bold tracking-tight mb-5 text-muted-foreground"> {/* Update 1 */}Cotizaciones</h2>
      {loading ? <p>Cargando...</p> : <DataTable columns={updatedColumns} data={data} />}
    </div>
  )
}

