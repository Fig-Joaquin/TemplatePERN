"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Quotation, WorkProductDetail } from "@/types/interfaces"
import { formatDate } from "@/utils/formDate"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { VehicleCard } from "@/components/VehicleCard"
import { Badge } from "@/components/ui/badge"
import { formatPriceCLP } from "@/utils/formatPriceCLP"

// Función auxiliar para obtener información del estado con estilos
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return { label: 'Aprobado', className: 'bg-[#16a34a] text-white border-[#16a34a]' };
    case 'rejected':
      return { label: 'Rechazado', className: 'bg-[#ef4444] text-white border-[#ef4444]' };
    case 'pending':
      return { label: 'Pendiente', className: 'bg-[#fbbf24] text-white border-[#fbbf24]' };
    default:
      return { label: status, className: '' };
  }
}

// Function to translate status to Spanish (mantenemos esta por compatibilidad)
const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    "approved": "Aprobado",
    "pending": "Pendiente",
    "rejected": "Rechazado",
    "completed": "Completado",
    "in_progress": "En Progreso",
    // Add more translations as needed
  }

  return translations[status] || status
}

export const columns: ColumnDef<Quotation & { totalPrice: number; details: WorkProductDetail[] }>[] = [
  {
    accessorKey: "quotation_id",
    header: "ID",
  },
  {
    accessorKey: "description",
    header: "Descripción",
  },
  {
    accessorKey: "quotation_status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("quotation_status") as string
      const badge = getStatusBadge(status)
      return <Badge className={badge.className}>{badge.label}</Badge>
    },
  },
  {
    accessorKey: "entry_date",
    header: "Fecha de Entrada",
    cell: ({ row }) => formatDate(row.getValue("entry_date")),
  },
  {
    accessorKey: "vehicle.license_plate",
    header: "Vehículo",
    cell: ({ row }) => (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="link">{row.original.vehicle?.license_plate}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles del Vehículo</DialogTitle>
          </DialogHeader>
          {row.original.vehicle ? (
            <VehicleCard vehicle={row.original.vehicle} />
          ) : (
            <div className="text-muted-foreground">Sin vehículo asignado</div>
          )}
        </DialogContent>
      </Dialog>
    ),
  },
  {
    accessorKey: "totalPrice",
    header: "Precio Total",
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("totalPrice"))
      const formatted = formatPriceCLP(amount)
      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const quotation = row.original
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Ver detalles</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalles de la Cotización</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold mb-2">Información de la cotización</h4>
                <p>ID: {quotation.quotation_id}</p>
                <p>Descripción: {quotation.description}</p>
                <p>Estado: {translateStatus(quotation.quotation_status)}</p>
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
                <h4 className="font-bold mb-2">Detalles de productos</h4>
                <ul>
                  {quotation.details.map((detail, index) => (
                    <li key={index}>
                      {detail.product?.product_name ?? "N/A"} - Cantidad: {detail.quantity} - Precio:{" "}
                      {formatPriceCLP(Number(detail.sale_price))} - Precio de mano de obra:{" "}
                      {formatPriceCLP(Number(detail.labor_price))}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )
    },
  },
]

