"use client"

import React from "react"
import type { Person } from "../../types/interfaces"
import { Button } from "@/components/ui/button"
import RutFormatter from "../RutFormatter"
import { Edit, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface EmployeeListProps {
  persons: Person[]
  handleEdit: (person: Person) => void
  handleDelete: (personId: number) => void
}

const EmployeeList: React.FC<EmployeeListProps> = ({ persons, handleEdit, handleDelete }) => {
  return (
    <div className="overflow-x-auto">
      {persons.length === 0 ? (
        <p>No hay información disponible.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RUT</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Apellido</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {persons.map((person) => (
              <TableRow key={person.person_id}>
                <TableCell>
                  <RutFormatter rut={person.rut || "No hay información"} />
                </TableCell>
                <TableCell>{person.name}</TableCell>
                <TableCell>{person.first_surname}</TableCell>
                <TableCell>{person.email || "No hay información"}</TableCell>
                <TableCell>+{person.number_phone || "No hay información"}</TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(person)}>
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Editar</span>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(person.person_id)}>
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Eliminar</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export default EmployeeList
