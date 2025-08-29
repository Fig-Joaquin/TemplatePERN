"use client"

import React, { useEffect, useState, useCallback } from "react"
import { toast } from "react-toastify"
import { Plus, Search, Users } from "lucide-react"
import ClientList from "../components/clientList"
import ClientForm from "../components/clientForm"
import type { Person, Vehicle } from "../types/interfaces"
import { createPerson, updatePerson, fetchPersonsClient, deletePerson } from "../services/personService"
import { fetchVehiclesByPersonId } from "../services/vehicleService"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"

const ClientPage = () => {
  const [persons, setPersons] = useState<Person[]>([])
  const [vehiclesMap, setVehiclesMap] = useState<{ [key: number]: Vehicle[] }>({})
  const [loading, setLoading] = useState(true)
  const [vehiclesLoading, setVehiclesLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<number | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)

  const initialFormData = {
    rut: "",
    name: "",
    first_surname: "",
    second_surname: "",
    email: "",
    number_phone: "",
    person_type: "cliente",
  }
  const [createFormData, setCreateFormData] = useState(initialFormData)
  const [editFormData, setEditFormData] = useState(initialFormData)

  // Cargar todos los clientes
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const clients = await fetchPersonsClient()
      setPersons(clients)
    } catch (error) {
      toast.error("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }, [])

  // Una vez cargados los clientes, obtener los vehículos de cada uno
  // Dentro de ClientPage.tsx

  useEffect(() => {
    if (persons.length === 0) {
      setVehiclesLoading(false)
      return
    }
    const fetchAllVehicles = async () => {
      try {
        setVehiclesLoading(true)
        const vehiclesArray = await Promise.all(
          persons.map(async (person) => {
            try {
              const personVehicles = await fetchVehiclesByPersonId(person.person_id)
              return { id: person.person_id, vehicles: personVehicles }
            } catch (err) {
              console.error("Error fetching vehicles for person", person.person_id, err)
              // Retornamos un array vacío si falla la petición para este cliente
              return { id: person.person_id, vehicles: [] }
            }
          })
        )
        const map = vehiclesArray.reduce((acc, { id, vehicles }) => {
          acc[id] = vehicles
          return acc
        }, {} as { [key: number]: Vehicle[] })
        setVehiclesMap(map)
      } catch (error) {
        console.error("Error en fetchAllVehicles:", error)
      } finally {
        setVehiclesLoading(false)
      }
    }
    fetchAllVehicles()
  }, [persons])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCreateFormData({ ...createFormData, [name]: value })
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditFormData({ ...editFormData, [name]: value })
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Prepare data with optional fields properly handled
      const dataToSubmit = {
        ...createFormData,
        email: createFormData.email.trim() || undefined,
        rut: createFormData.rut.trim() || undefined,
        second_surname: createFormData.second_surname.trim() || undefined
      }
      await createPerson(dataToSubmit)
      toast.success("Cliente creado exitosamente")
      setAddModalOpen(false)
      setCreateFormData(initialFormData)
      fetchData()
    } catch (error: any) {
      toast.error(
        [error.response?.data?.message, error.response?.data?.errors?.map((e: any) => e.message).join(", ")]
          .filter(Boolean)
          .join(", ") || "Error al crear el cliente"
      )
    }
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedPerson) {
        // Prepare data with optional fields properly handled
        const dataToSubmit = {
          ...editFormData,
          email: editFormData.email.trim() || undefined,
          rut: editFormData.rut.trim() || undefined,
          second_surname: editFormData.second_surname.trim() || undefined
        }
        await updatePerson(selectedPerson.person_id, dataToSubmit)
        toast.success("Cliente actualizado exitosamente")
        setEditModalOpen(false)
        setSelectedPerson(null)
        setEditFormData(initialFormData)
        fetchData()
      }
    } catch (error: any) {
      toast.error(
        [error.response?.data?.message, error.response?.data?.errors?.map((e: any) => e.message).join(", ")]
          .filter(Boolean)
          .join(", ") || "Error al actualizar el cliente"
      )
    }
  }

  const handleEdit = (person: Person) => {
    setSelectedPerson(person)
    setEditFormData({
      rut: person.rut || "",
      name: person.name,
      first_surname: person.first_surname,
      second_surname: person.second_surname || "",
      email: person.email || "",
      number_phone: person.number_phone,
      person_type: person.person_type,
    })
    setEditModalOpen(true)
  }

  const handleDelete = (personId: number) => {
    setClientToDelete(personId)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (clientToDelete !== null) {
      try {
        await deletePerson(clientToDelete)
        toast.success("Cliente eliminado exitosamente")
        fetchData()
      } catch (error: any) {
        toast.error(
          [error.response?.data?.message, error.response?.data?.errors?.map((e: any) => e.message).join(", ")]
            .filter(Boolean)
            .join(", ") || "Error al eliminar el cliente"
        )
      } finally {
        setDeleteModalOpen(false)
        setClientToDelete(null)
      }
    }
  }

  const filteredPersons = persons.filter(
    (person) =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.rut?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Mientras se cargan tanto clientes como vehículos, mostramos un spinner
  const isLoading = loading || vehiclesLoading

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Users className="w-8 h-8" />
          Lista de Clientes
        </h1>
        <Button onClick={() => setAddModalOpen(true)} className="mt-4 sm:mt-0">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar cliente por nombre o RUT..."
          value={searchTerm}
          onChange={handleSearch}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      </div>

      <motion.div
        className="bg-card shadow rounded-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {isLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground">Cargando clientes...</p>
          </div>
        ) : (
          <AnimatePresence>
            <ClientList
              persons={filteredPersons}
              vehiclesMap={vehiclesMap}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
            />
          </AnimatePresence>
        )}
      </motion.div>

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <ClientForm
            formData={createFormData}
            handleInputChange={handleCreateInputChange}
            handleSubmit={handleCreateSubmit}
            onCancel={() => setAddModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editModalOpen}
        onOpenChange={() => {
          setEditModalOpen(false)
          setSelectedPerson(null)
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <ClientForm
            formData={editFormData}
            handleInputChange={handleEditInputChange}
            handleSubmit={handleUpdateSubmit}
            onCancel={() => {
              setEditModalOpen(false)
              setSelectedPerson(null)
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">¡Advertencia! Eliminación Permanente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center font-medium">¿Estás seguro de eliminar este cliente?</p>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm">
              <p><strong>ATENCIÓN:</strong> Esta acción eliminará permanentemente:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Todos los datos personales del cliente</li>
                <li>Todos sus vehículos registrados</li>
                <li>Historiales de kilometraje</li>
                <li>Cotizaciones y órdenes de trabajo asociadas</li>
                <li>Pagos y registros de deudores</li>
              </ul>
              <p className="mt-2 font-semibold">Esta acción no se puede deshacer.</p>
            </div>
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Eliminar permanentemente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ClientPage
