"use client"

import type React from "react"
import { motion, AnimatePresence } from "framer-motion"

// EmployeePage.tsx
import { useEffect, useState } from "react"
import api from "../utils/axiosConfig"
import { toast } from "react-toastify"
import { Plus, Users } from "lucide-react"
import type { Person, Vehicle } from "../types/interfaces"
import { createPerson, updatePerson, fetchPersonsEmployee } from "../services/personService"
import { fetchVehicles, fetchVehiclesByPersonId } from "../services/vehicleService"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import EmployeeForm from "@/components/employee/employeeForm"
import EmployeeList from "@/components/employee/employeeList"
import SearchBar from "@/components/searchBar"

const EmployeePage = () => {
  const [persons, setPersons] = useState<Person[]>([])
  const [, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)

  // Formulario inicial: rol predefinido como "employee"
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

  useEffect(() => {
    const fetchPersons = async () => {
      try {
        const employees = await fetchPersonsEmployee()
        setPersons(employees)
      } catch {
        toast.error("Error loading employees")
      } finally {
        setLoading(false)
      }
    }

    const fetchVehiclesData = async () => {
      try {
        const vehicles = await fetchVehicles()
        setVehicles(vehicles)
      } catch {
        toast.error("Error loading vehicles")
      }
    }

    fetchPersons()
    fetchVehiclesData()
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCreateFormData({ ...createFormData, [name]: value, person_type: "trabajador" })
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditFormData({ ...editFormData, [name]: value })
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createPerson(createFormData)
      toast.success("Se ha creado un nuevo trabajador")
      setAddModalOpen(false)
      setCreateFormData(initialFormData)
      const employees = await fetchPersonsEmployee()
      setPersons(employees)
    } catch (error: any) {
      toast.error(
        [error.response?.data?.message, error.response?.data?.errors?.map((err: any) => err.message).join(", ")]
          .filter(Boolean)
          .join(", ") || "Error creating employee",
      )
    }
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedPerson) {
        await updatePerson(selectedPerson.person_id, editFormData)
        toast.success("Employee updated successfully")
        setEditModalOpen(false)
        setSelectedPerson(null)
        setEditFormData(initialFormData)
        const employees = await fetchPersonsEmployee()
        setPersons(employees)
      }
    } catch (error: any) {
      toast.error(
        [error.response?.data?.message, error.response?.data?.errors?.map((err: any) => err.message).join(", ")]
          .filter(Boolean)
          .join(", ") || "Error updating employee",
      )
    }
  }

  const handleEdit = (person: Person) => {
    setSelectedPerson(person)
    setEditFormData({
      rut: person.rut,
      name: person.name,
      first_surname: person.first_surname,
      second_surname: person.second_surname || "",
      email: person.email,
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
        await api.delete(`/persons/${employeeToDelete}`)
        toast.success("Se ha eliminado el trabajador")
        setPersons(persons.filter((person) => person.person_id !== employeeToDelete))
      } catch (error: any) {
        toast.error(
          [error.response?.data?.message, error.response?.data?.errors?.map((err: any) => err.message).join(", ")]
            .filter(Boolean)
            .join(", ") || "Error al eliminar el empleado",
        )
      } finally {
        setDeleteModalOpen(false)
        setEmployeeToDelete(null)
      }
    }
  }

  const filteredPersons = persons.filter(
    (person) =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.rut.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-primary">
          <Users className="w-8 h-8" />
          Lista de trabajadores</h1>
        <Button onClick={() => setAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Trabajador
        </Button>
      </div>

      <SearchBar searchTerm={searchTerm} handleSearch={handleSearch} />

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Cargando empleados...</p>
        </div>
      ) : (
        <motion.div
          className="bg-card/30 backdrop-blur-md rounded-lg shadow p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence>
            <EmployeeList
              persons={filteredPersons}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
            />
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        {addModalOpen && <div className="fixed inset-0 bg-transparent backdrop-blur-sm" />}
        <DialogContent className="w-96 bg-card text-card-foreground shadow-lg rounded-lg p-6">
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

      {/* Edit Modal */}
      <Dialog
        open={editModalOpen}
        onOpenChange={() => {
          setEditModalOpen(false)
          setSelectedPerson(null)
        }}
      >
        {editModalOpen && <div className="fixed inset-0 bg-transparent backdrop-blur-sm" />}
        <DialogContent className="w-96 bg-card text-card-foreground shadow-lg rounded-lg p-6">
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
          />
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        {deleteModalOpen && <div className="fixed inset-0 bg-transparent backdrop-blur-sm" />}
        <DialogContent className="w-96 bg-card text-card-foreground shadow-lg rounded-lg p-6">
          <DialogHeader>
            <DialogTitle>Eliminar Trabajador</DialogTitle>
          </DialogHeader>
          <p>¿Desea eliminar este trabajador?</p>
          <div className="flex justify-end mt-4 gap-2">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default EmployeePage

