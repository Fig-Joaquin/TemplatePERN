"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Company, Brand } from "@/types/interfaces"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import RutFormatter from "../RutFormatter"
import VehicleList from "../vehicleList"

export const companyColumns = (
  handleEdit: (company: Company) => void,
  handleDelete: (companyId: number) => void,
  brands?: Brand[]
): ColumnDef<Company>[] => [
  {
    accessorKey: "rut",
    header: "RUT",
    cell: ({ row }) => {
      const rut = row.getValue("rut") as string
      return rut ? <RutFormatter rut={rut} /> : "No hay información"
    },
  },
  {
    accessorKey: "name",
    header: "Nombre",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue("email") as string | undefined
      return email || "No hay información"
    },
  },
  {
    accessorKey: "phone",
    header: "Teléfono",
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string | undefined
      return phone ? `+${phone}` : "No hay información"
    },
  },
  {
    accessorKey: "company_id",
    header: "Vehículos",
    cell: ({ row }) => {
      const company = row.original
      const companyId = row.getValue("company_id") as number
      return (
        <VehicleList
          vehicles={company.vehicles || []}
          brands={brands}
          companyId={companyId}
        />
      )
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const company = row.original
      return (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(company)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(company.company_id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    },
  },
]
