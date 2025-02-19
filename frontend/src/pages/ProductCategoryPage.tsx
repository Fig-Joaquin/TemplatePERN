"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { Card, CardHeader, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  fetchProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from "../services/ProductCategoryService"
import type { category } from "../types/interfaces"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

const ProductCategoryPage = () => {
  const [categories, setCategories] = useState<category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [categoryName, setCategoryName] = useState("")
  const [editingCategory, setEditingCategory] = useState<category | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setIsLoading(true)
    try {
      const data = await fetchProductCategories()
      setCategories(data)
    } catch (error) {
      toast.error("Error al cargar las categorías")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryName.trim()) {
      toast.error("El nombre de la categoría es obligatorio")
      return
    }
    try {
      await createProductCategory({ category_name: categoryName })
      toast.success("Categoría creada exitosamente")
      setIsCreateModalOpen(false)
      resetForm()
      loadCategories()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al crear la categoría")
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory || !categoryName.trim()) return
    try {
      await updateProductCategory(editingCategory.product_category_id, { category_name: categoryName })
      toast.success("Categoría actualizada correctamente")
      setIsEditModalOpen(false)
      setEditingCategory(null)
      setCategoryName("")
      loadCategories()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al actualizar la categoría")
    }
  }

  const handleDelete = async (category: category) => {
    if (window.confirm(`¿Está seguro de eliminar la categoría "${category.category_name}"?`)) {
      try {
        await deleteProductCategory(category.product_category_id)
        toast.success("Categoría eliminada correctamente")
        loadCategories()
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Error al eliminar la categoría")
      }
    }
  }

  const resetForm = () => {
    setCategoryName("")
  }

  const openEditModal = (category: category) => {
    setEditingCategory(category)
    setCategoryName(category.category_name)
    setIsEditModalOpen(true)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Categorías de Productos</h1>
        <Button
          onClick={() => {
            resetForm()
            setIsCreateModalOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center">Cargando categorías...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.product_category_id} className="shadow-md">
              <CardHeader className="font-semibold">{category.category_name}</CardHeader>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => openEditModal(category)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(category)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Creación */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Categoría</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Nombre de la Categoría</Label>
                <Input
                  id="categoryName"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Ingrese el nombre de la categoría"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Crear Categoría</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoría</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editCategoryName">Nombre de la Categoría</Label>
                <Input
                  id="editCategoryName"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Ingrese el nuevo nombre de la categoría"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Actualizar Categoría</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProductCategoryPage

