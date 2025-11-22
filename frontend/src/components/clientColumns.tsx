"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Person, Vehicle } from "@/types/interfaces"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import RutFormatter from "./RutFormatter"
import VehicleList from "./vehicleList"

export const clientColumns = (
  handleEdit: (person: Person) => void,
  handleDelete: (personId: number) => void,
  vehiclesMap: { [key: number]: Vehicle[] }
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
    accessorKey: "person_id",
    header: "Vehículos",
    cell: ({ row }) => {
      const personId = row.getValue("person_id") as number
      return (
        <VehicleList
          vehicles={vehiclesMap[personId] || []}
          personId={personId}
        />
      )
    },
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
