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
import { Plus, Edit, Trash2, Folder, Search, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())

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

  const toggleExpand = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Folder className="w-8 h-8" />
          Categorías de Productos
        </h1>
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

      <div className="flex items-center space-x-2">
        <Search className="w-5 h-5 text-gray-500" />
        <Input
          type="text"
          placeholder="Buscar categorías..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Cargando categorías...</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredCategories.map((category) => (
              <motion.div
                key={category.product_category_id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-card rounded-lg shadow-md overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer flex justify-between items-center"
                  onClick={() => toggleExpand(category.product_category_id)}
                >
                  <h3 className="text-lg font-semibold">{category.category_name}</h3>
                  <ChevronRight
                    className={`transform transition-transform duration-200 ${
                      expandedCategories.has(category.product_category_id) ? "rotate-90" : ""
                    }`}
                  />
                </div>
                <AnimatePresence>
                  {expandedCategories.has(category.product_category_id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 pb-4"
                    >
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(category)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(category)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
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

