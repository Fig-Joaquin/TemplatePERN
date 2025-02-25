// src/pages/CompaniesPage.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "react-toastify"
import { Plus, Search, Building } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Company, brand } from "@/types/interfaces"
import { createCompany, deleteCompany, fetchCompanies, updateCompany } from "@/services/work/companiesList"
import CompanyList from "@/components/work/companiesList"
import CompanyForm from "@/components/work/companiesForm"
import { fetchVehicleBrands } from "@/services/VehicleBrandService"

const CompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [brands, setBrands] = useState<brand[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState<number | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  const initialFormData = {
    rut: "",
    name: "",
    email: "",
    phone: ""
  }

  const [createFormData, setCreateFormData] = useState(initialFormData)
  const [editFormData, setEditFormData] = useState(initialFormData)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [companiesData, brandsData] = await Promise.all([
        fetchCompanies(),
        fetchVehicleBrands()
      ])
      setCompanies(companiesData)
      setBrands(brandsData)
    } catch (error) {
      toast.error("Error al cargar las empresas")
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
      await createCompany(createFormData)
      toast.success("Empresa creada exitosamente")
      setAddModalOpen(false)
      setCreateFormData(initialFormData)
      fetchData()
    } catch (error: any) {
      toast.error(
        [error.response?.data?.message, error.response?.data?.errors?.map((e: any) => e.message).join(", ")].filter(Boolean).join(", ") ||
        "Error al crear la empresa"
      )
    }
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedCompany) {
        await updateCompany(selectedCompany.company_id, editFormData)
        toast.success("Empresa actualizada exitosamente")
        setEditModalOpen(false)
        setSelectedCompany(null)
        setEditFormData(initialFormData)
        fetchData()
      }
    } catch (error: any) {
      toast.error(
        [error.response?.data?.message, error.response?.data?.errors?.map((e: any) => e.message).join(", ")].filter(Boolean).join(", ") ||
        "Error al actualizar la empresa"
      )
    }
  }

  const handleEdit = (company: Company) => {
    setSelectedCompany(company)
    setEditFormData({
      rut: company.rut,
      name: company.name,
      email: company.email,
      phone: company.phone || ""
    })
    setEditModalOpen(true)
  }

  const handleDelete = (companyId: number) => {
    setCompanyToDelete(companyId)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (companyToDelete !== null) {
      try {
        await deleteCompany(companyToDelete)
        toast.success("Empresa eliminada exitosamente")
        fetchData()
      } catch (error: any) {
        toast.error(
          [error.response?.data?.message, error.response?.data?.errors?.map((e: any) => e.message).join(", ")].filter(Boolean).join(", ") ||
          "Error al eliminar la empresa"
        )
      } finally {
        setDeleteModalOpen(false)
        setCompanyToDelete(null)
      }
    }
  }

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.phone && company.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Building className="w-8 h-8" />
          Lista de Empresas
        </h1>
        <Button onClick={() => setAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Empresa
        </Button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar empresa por nombre, RUT, email o teléfono..."
          value={searchTerm}
          onChange={handleSearch}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
      </div>

      {/* Listado de empresas */}
      <motion.div
        className="bg-card shadow-lg rounded-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground">Cargando empresas...</p>
          </div>
        ) : (
          <AnimatePresence>
            <CompanyList
              companies={filteredCompanies}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              brands={brands}
            />
          </AnimatePresence>
        )}
      </motion.div>

      {/* Modal para agregar empresa */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nueva Empresa</DialogTitle>
          </DialogHeader>
          <CompanyForm
            formData={createFormData}
            handleInputChange={handleCreateInputChange}
            handleSubmit={handleCreateSubmit}
            onCancel={() => setAddModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal para editar empresa */}
      <Dialog open={editModalOpen} onOpenChange={() => { setEditModalOpen(false); setSelectedCompany(null) }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
          </DialogHeader>
          <CompanyForm
            formData={editFormData}
            handleInputChange={handleEditInputChange}
            handleSubmit={handleUpdateSubmit}
            onCancel={() => { setEditModalOpen(false); setSelectedCompany(null) }}
          />
        </DialogContent>
      </Dialog>

      {/* Modal para confirmar eliminación */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <p>¿Estás seguro de eliminar esta empresa?</p>
          <div className="flex justify-end mt-4 gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CompaniesPage;
