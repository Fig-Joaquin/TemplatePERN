"use client"

import React from "react"
import type { Person } from "../../types/interfaces"
import { Button } from "@/components/ui/button"
import RutFormatter from "../RutFormatter"

interface EmployeeListProps {
  persons: Person[]
  handleEdit: (person: Person) => void
  handleDelete: (personId: number) => void
}

const EmployeeList: React.FC<EmployeeListProps> = ({ persons, handleEdit, handleDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              RUT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Apellido
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Teléfono
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {persons.map((person) => (
            <tr key={person.person_id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <RutFormatter rut={person.rut || "No hay información"} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {person.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {person.first_surname}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {person.email || "No hay información"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                +{person.number_phone || "No hay información"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                <Button variant="outline" onClick={() => handleEdit(person)}>
                  Editar
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(person.person_id)}>
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default EmployeeList
