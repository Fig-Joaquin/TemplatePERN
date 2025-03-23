"use client"

import React from "react"
import { Edit, Trash2 } from "lucide-react"
import VehicleList from "./vehicleList"
import type { Person } from "../types/interfaces"
import { Button } from "@/components/ui/button"
import RutFormatter from "./RutFormatter"

interface ClientListProps {
  persons: Person[]
  vehiclesMap: { [key: number]: any[] } // Array de vehículos por persona
  handleEdit: (person: Person) => void
  handleDelete: (personId: number) => void
}

const ClientList: React.FC<ClientListProps> = ({
  persons,
  vehiclesMap,
  handleEdit,
  handleDelete,
}) => {
  return (
    <div className="overflow-x-auto">
      {persons.length === 0 ? (
        <p>No hay información disponible.</p>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apellido</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehículos</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {persons.map((person) => (
              <tr key={person.person_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {person.rut ? <RutFormatter rut={person.rut} /> : "No hay información"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{person.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{person.first_surname}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {person.email ? person.email : "No hay información"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">+{person.number_phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <VehicleList vehicles={vehiclesMap[person.person_id] || []} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(person)}>
                    <Edit className="w-4 h-4" />
                    <span className="hidden sm:inline">Editar</span>
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(person.person_id)}>
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Eliminar</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default ClientList
