"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { toast } from "react-toastify"
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
import { Plus, Edit, Trash2, Folder, Search, Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"

const ProductCategoryPage = () => {
  const [categories, setCategories] = useState<category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [categoryName, setCategoryName] = useState("")
  const [editingCategory, setEditingCategory] = useState<category | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<category | null>(null)

  const loadCategories = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchProductCategories()
      setCategories(data)
      setFilteredCategories(data)
    } catch (error) {
      toast.error("Error al cargar las categorías")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    setFilteredCategories(
      categories.filter((category) => category.category_name.toLowerCase().includes(searchTerm.toLowerCase())),
    )
  }, [categories, searchTerm])

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

  const handleDelete = (category: category) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return
    try {
      await deleteProductCategory(categoryToDelete.product_category_id)
      toast.success("Categoría eliminada correctamente")
      loadCategories()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al eliminar la categoría")
    } finally {
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
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
    <motion.div 
      className="container mx-auto p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Section with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-primary/10">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium">Total Categorías</p>
              <h3 className="text-2xl font-bold">{categories.length}</h3>
            </div>
            <Folder className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card className="chart-4">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium">Última Actualización</p>
              <p className="text-sm">{new Date().toLocaleDateString()}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
      </div>

      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Categorías de Productos</h1>
          <p className="text-muted-foreground">Gestiona las categorías de productos disponibles</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setIsCreateModalOpen(true)
          }}
          className="w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {/* Search Section */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Cargando categorías...</p>
        </div>
      ) : filteredCategories.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence>
            {filteredCategories.map((category) => (
              <motion.div
                key={category.product_category_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Folder className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">{category.category_name}</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <Badge variant="secondary" className="mb-2">
                      ID: {category.product_category_id}
                    </Badge>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2 pt-3 border-t">
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
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center py-16 px-4"
        >
          <div className="bg-muted/50 rounded-full p-8 mb-6">
            <Folder className="w-24 h-24 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            No se encontraron categorías
          </h2>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            {searchTerm
              ? "No hay categorías que coincidan con tu búsqueda. Intenta con otros términos."
              : "Aún no hay categorías registradas. Crea la primera categoría para comenzar."}
          </p>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear Primera Categoría
          </Button>
        </motion.div>
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

      {/* Dialog de confirmación para eliminar */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <p>¿Está seguro que desea eliminar la categoría "{categoryToDelete?.category_name}"?</p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default ProductCategoryPage

