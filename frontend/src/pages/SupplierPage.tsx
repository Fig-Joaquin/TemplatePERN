"use client"

import React, { useEffect, useState, useCallback } from "react"
import { toast } from "react-toastify"
import { Plus, Search, Truck } from "lucide-react"
import SupplierList from "../components/supplierList"
import SupplierForm from "../components/supplierForm"
import type { Supplier } from "../types/interfaces"
import { createSupplier, updateSupplier, fetchSuppliers, deleteSupplier } from "../services/supplierService"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import DeleteConfirmation from "../components/DeleteConfirmation"

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
    } catch (error) {
      console.error("Error al cargar los datos:", error)
      toast.error("Error al cargar los datos")
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

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.city && supplier.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      supplier.phone.includes(searchTerm)
  )

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Truck className="w-8 h-8" />
          Lista de Proveedores
        </h1>
        <Button onClick={() => setAddModalOpen(true)} className="mt-4 sm:mt-0">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proveedor
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Buscar por nombre, ciudad o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <AnimatePresence>
            <SupplierList
              suppliers={filteredSuppliers}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
            />
          </AnimatePresence>
        )}
      </motion.div>

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

      <DeleteConfirmation
        isOpen={deleteModalOpen}
        onConfirm={confirmDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  )
}

export default SupplierPage
