"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Supplier } from "@/types/interfaces"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"

export const supplierColumns = (
  handleEdit: (supplier: Supplier) => void,
  handleDelete: (supplierId: number) => void
): ColumnDef<Supplier>[] => [
  {
    accessorKey: "name",
    header: "Nombre",
  },
  {
    accessorKey: "address",
    header: "Dirección",
    cell: ({ row }) => {
      const address = row.getValue("address") as string | undefined
      return address || "No hay información"
    },
  },
  {
    accessorKey: "city",
    header: "Ciudad",
    cell: ({ row }) => {
      const city = row.getValue("city") as string | undefined
      return city || "No hay información"
    },
  },
  {
    accessorKey: "phone",
    header: "Teléfono",
    cell: ({ row }) => `+${row.getValue("phone")}`,
  },
  {
    accessorKey: "description",
    header: "Descripción",
    cell: ({ row }) => {
      const description = row.getValue("description") as string | undefined
      return description || "No hay información"
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const supplier = row.original
      return (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(supplier)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(supplier.supplier_id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    },
  },
]
