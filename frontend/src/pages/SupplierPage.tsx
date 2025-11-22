"use client"

import React, { useEffect, useState, useCallback } from "react"
import { toast } from "react-toastify"
import { Plus, Search, Truck } from "lucide-react"
import SupplierForm from "../components/supplierForm"
import { DataTable } from "@/components/data-table"
import { supplierColumns } from "@/components/supplierColumns"
import type { Supplier } from "../types/interfaces"
import { createSupplier, updateSupplier, fetchSuppliers, deleteSupplier } from "../services/supplierService"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion,  } from "framer-motion"

const SupplierPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<number | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  const initialFormData = {
    name: "",
    address: "",
    city: "",
    description: "",
    phone: "",
  }
  const [createFormData, setCreateFormData] = useState(initialFormData)
  const [editFormData, setEditFormData] = useState(initialFormData)

  // Cargar todos los proveedores
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const suppliersData = await fetchSuppliers()
      setSuppliers(suppliersData)
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

  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCreateFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createSupplier(createFormData)
      toast.success("Proveedor creado exitosamente")
      setAddModalOpen(false)
      setCreateFormData(initialFormData)
      fetchData()
    } catch (error: any) {
      toast.error(
        [error.response?.data?.message, error.response?.data?.errors?.map((e: any) => e.message).join(", ")]
          .filter(Boolean)
          .join(", ") || "Error al crear el proveedor"
      )
    }
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedSupplier) {
        await updateSupplier(selectedSupplier.supplier_id, editFormData)
        toast.success("Proveedor actualizado exitosamente")
        setEditModalOpen(false)
        setSelectedSupplier(null)
        setEditFormData(initialFormData)
        fetchData()
      }
    } catch (error: any) {
      toast.error(
        [error.response?.data?.message, error.response?.data?.errors?.map((e: any) => e.message).join(", ")]
          .filter(Boolean)
          .join(", ") || "Error al actualizar el proveedor"
      )
    }
  }

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setEditFormData({
      name: supplier.name,
      address: supplier.address || "",
      city: supplier.city || "",
      description: supplier.description || "",
      phone: supplier.phone,
    })
    setEditModalOpen(true)
  }

  const handleDelete = (supplierId: number) => {
    setSupplierToDelete(supplierId)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (supplierToDelete) {
      try {
        await deleteSupplier(supplierToDelete)
        toast.success("Proveedor eliminado exitosamente")
        fetchData()
      } catch (error: any) {
        toast.error(
          [error.response?.data?.message, error.response?.data?.errors?.map((e: any) => e.message).join(", ")]
            .filter(Boolean)
            .join(", ") || "Error al eliminar el proveedor"
        )
      } finally {
        setDeleteModalOpen(false)
        setSupplierToDelete(null)
      }
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone.includes(searchTerm)
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
          <Truck className="w-8 h-8" />
          Proveedores
        </h1>
        <Button onClick={() => setAddModalOpen(true)} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proveedor
        </Button>
      </div>

      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar proveedor por nombre, ciudad o teléfono..."
          value={searchTerm}
          onChange={handleSearch}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Cargando proveedores...</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {filteredSuppliers.length === 0 && searchTerm ? (
            <div className="text-center py-10">
              <Truck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                No se encontraron proveedores que coincidan con "{searchTerm}"
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Intenta buscar por nombre, ciudad o teléfono
              </p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-10">
              <Truck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                No hay proveedores registrados
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Comienza agregando un nuevo proveedor
              </p>
            </div>
          ) : (
            <DataTable 
              columns={supplierColumns(handleEdit, handleDelete)} 
              data={filteredSuppliers} 
            />
          )}
        </motion.div>
      )}

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nuevo Proveedor</DialogTitle>
          </DialogHeader>
          <SupplierForm
            formData={createFormData}
            handleInputChange={handleCreateInputChange}
            handleSubmit={handleCreateSubmit}
            onCancel={() => setAddModalOpen(false)}
            isCreating={true}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editModalOpen}
        onOpenChange={() => {
          setEditModalOpen(false)
          setSelectedSupplier(null)
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Proveedor</DialogTitle>
          </DialogHeader>
          <SupplierForm
            formData={editFormData}
            handleInputChange={handleEditInputChange}
            handleSubmit={handleUpdateSubmit}
            onCancel={() => {
              setEditModalOpen(false)
              setSelectedSupplier(null)
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
            <p className="text-center font-medium">¿Estás seguro de eliminar este proveedor?</p>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm">
              <p><strong>ATENCIÓN:</strong> Esta acción eliminará permanentemente:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Todos los datos del proveedor</li>
                <li>Historial de compras relacionadas</li>
                <li>Productos asociados al proveedor</li>
              </ul>
              <p className="mt-2 font-semibold">Esta acción no se puede deshacer.</p>
            </div>
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar permanentemente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default SupplierPage
