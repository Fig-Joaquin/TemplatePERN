"use client"

import React, { useEffect, useState, useCallback } from "react"
import { toast } from "react-toastify"
import { Plus, Search, Users } from "lucide-react"
import EmployeeForm from "@/components/employee/employeeForm"
import { DataTable } from "@/components/data-table"
import { employeeColumns } from "@/components/employee/employeeColumns"
import type { Person } from "../types/interfaces"
import { createPerson, updatePerson, fetchPersonsEmployee, deletePerson } from "../services/personService"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion,  } from "framer-motion"

const EmployeePage = () => {
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)

  const initialFormData = {
    rut: "",
    name: "",
    first_surname: "",
    second_surname: "",
    email: "",
    number_phone: "",
    person_type: "trabajador",
  }
  const [createFormData, setCreateFormData] = useState(initialFormData)
  const [editFormData, setEditFormData] = useState(initialFormData)

  // Cargar todos los empleados
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const employees = await fetchPersonsEmployee()
      setPersons(employees)
    } catch (error: any) {
      console.error("Error al cargar los datos:", error)
      toast.error(error.response?.data?.message || error.message || "Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }, [])

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
      toast.success("Trabajador creado exitosamente")
      setAddModalOpen(false)
      setCreateFormData(initialFormData)
      fetchData()
    } catch (error: any) {
      toast.error(
        [error.response?.data?.message, error.response?.data?.errors?.map((e: any) => e.message).join(", ")]
          .filter(Boolean)
          .join(", ") || "Error al crear el trabajador"
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
        toast.success("Trabajador actualizado exitosamente")
        setEditModalOpen(false)
        setSelectedPerson(null)
        setEditFormData(initialFormData)
        fetchData()
      }
    } catch (error: any) {
      toast.error(
        [error.response?.data?.message, error.response?.data?.errors?.map((e: any) => e.message).join(", ")]
          .filter(Boolean)
          .join(", ") || "Error al actualizar el trabajador"
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
    setEmployeeToDelete(personId)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (employeeToDelete !== null) {
      try {
        await deletePerson(employeeToDelete)
        toast.success("Trabajador eliminado exitosamente")
        fetchData()
      } catch (error: any) {
        // Handle specific error messages from backend
        if (error.response?.data?.details) {
          // Show detailed message for work order conflicts
          toast.error(`${error.response.data.message}\n\n${error.response.data.details}`, {
            autoClose: 8000, // Show longer for detailed messages
          })
        } else {
          // Fallback to general error handling
          toast.error(
            [error.response?.data?.message, error.response?.data?.errors?.map((err: any) => err.message).join(", ")]
              .filter(Boolean)
              .join(", ") || "Error al eliminar el trabajador",
          )
        }
      } finally {
        setDeleteModalOpen(false)
        setEmployeeToDelete(null)
      }
    }
  }

  const filteredPersons = persons.filter(
    (person) =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.rut?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Users className="w-8 h-8" />
          Trabajadores
        </h1>
        <Button onClick={() => setAddModalOpen(true)} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Trabajador
        </Button>
      </div>

      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar trabajador por nombre o RUT..."
          value={searchTerm}
          onChange={handleSearch}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Cargando trabajadores...</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {filteredPersons.length === 0 && searchTerm ? (
            <div className="text-center py-10">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                No se encontraron trabajadores que coincidan con "{searchTerm}"
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Intenta buscar por nombre o RUT
              </p>
            </div>
          ) : filteredPersons.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                No hay trabajadores registrados
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Comienza agregando un nuevo trabajador
              </p>
            </div>
          ) : (
            <DataTable 
              columns={employeeColumns(handleEdit, handleDelete)} 
              data={filteredPersons} 
            />
          )}
        </motion.div>
      )}

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nuevo Trabajador</DialogTitle>
          </DialogHeader>
          <EmployeeForm
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
            <DialogTitle>Editar Trabajador</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            formData={editFormData}
            handleInputChange={handleEditInputChange}
            handleSubmit={handleUpdateSubmit}
            onCancel={() => {
              setEditModalOpen(false)
              setSelectedPerson(null)
            }}
            isEditing={true}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">¡Advertencia! Eliminación Permanente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center font-medium">¿Estás seguro de eliminar este trabajador?</p>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm">
              <p><strong>ATENCIÓN:</strong> Esta acción eliminará permanentemente:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Todos los datos personales del trabajador</li>
                <li>Órdenes de trabajo asociadas</li>
                <li>Historial de trabajos realizados</li>
                <li>Asignaciones de vehículos</li>
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
    </motion.div>
  )
}

export default EmployeePage
