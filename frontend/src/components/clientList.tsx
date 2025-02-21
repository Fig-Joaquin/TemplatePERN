"use client"

import type React from "react"
import { Edit, Trash2 } from "lucide-react"
import VehicleList from "./vehicleList"
import type { Vehicle, Person } from "../types/interfaces"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import RutFormatter from "./RutFormatter"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ClientListProps {
  persons: Person[]
  getVehiclesByPersonId: (personId: number) => Promise<Vehicle[]>
  handleEdit: (person: Person) => void
  handleDelete: (personId: number) => void
}

const ClientList: React.FC<ClientListProps> = ({ persons, getVehiclesByPersonId, handleEdit, handleDelete }) => {
  const [vehicles, setVehicles] = useState<{ [key: number]: Vehicle[] }>({})

  useEffect(() => {
    const fetchVehicles = async () => {
      const vehiclesData: { [key: number]: Vehicle[] } = {}
      for (const person of persons) {
        vehiclesData[person.person_id] = await getVehiclesByPersonId(person.person_id)
      }
      setVehicles(vehiclesData)
    }

    fetchVehicles()
  }, [persons, getVehiclesByPersonId])

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>RUT</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Apellido</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Vehículos</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {persons.map((person) => (
          <TableRow key={person.person_id}>
            <TableCell>
              <RutFormatter rut={person.rut} />
            </TableCell>
            <TableCell>{person.name}</TableCell>
            <TableCell>{person.first_surname}</TableCell>
            <TableCell>{person.email}</TableCell>
            <TableCell>
              <VehicleList vehicles={vehicles[person.person_id] || []} />
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(person)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(person.person_id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default ClientList

