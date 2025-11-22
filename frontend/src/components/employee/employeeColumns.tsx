"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Person } from "@/types/interfaces"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import RutFormatter from "../RutFormatter"

export const employeeColumns = (
  handleEdit: (person: Person) => void,
  handleDelete: (personId: number) => void
): ColumnDef<Person>[] => [
  {
    accessorKey: "rut",
    header: "RUT",
    cell: ({ row }) => {
      const rut = row.getValue("rut") as string | undefined
      return rut ? <RutFormatter rut={rut} /> : "No hay información"
    },
  },
  {
    accessorKey: "name",
    header: "Nombre",
  },
  {
    accessorKey: "first_surname",
    header: "Apellido",
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
    accessorKey: "number_phone",
    header: "Teléfono",
    cell: ({ row }) => `+${row.getValue("number_phone")}`,
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const person = row.original
      return (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(person)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(person.person_id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    },
  },
]
