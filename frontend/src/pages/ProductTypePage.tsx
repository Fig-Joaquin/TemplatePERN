"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { toast } from "react-toastify"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Tag, Search } from "lucide-react"
import {
  fetchProductTypes,
  createProductType,
  updateProductType,
  deleteProductType,
} from "../services/ProductTypeService"
import { fetchProductCategories } from "../services/ProductCategoryService"
import type { type as ProductType, category } from "../types/interfaces"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const ProductTypePage = () => {
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [filteredProductTypes, setFilteredProductTypes] = useState<ProductType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [formValue, setFormValue] = useState("")
  const [editingType, setEditingType] = useState<ProductType | null>(null)
  const [categories, setCategories] = useState<category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [typeToDelete, setTypeToDelete] = useState<ProductType | null>(null)


  const loadTypes = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchProductTypes()
      setProductTypes(data)
      setFilteredProductTypes(data)
    } catch (error) {
      toast.error("Error al cargar los tipos de producto")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchProductCategories()
      setCategories(data)
    } catch (error) {
      toast.error("Error al cargar las categorías")
    }
  }, [])

  useEffect(() => {
    loadTypes()
    loadCategories()
  }, [loadTypes, loadCategories])

  useEffect(() => {
    setFilteredProductTypes(
      productTypes.filter(
        (type) =>
          type.type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          type.category?.category_name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    )
  }, [productTypes, searchTerm])

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formValue.trim() || selectedCategory === null) {
      toast.error("El nombre y la categoría son obligatorios")
      return
    }
    try {
      await createProductType({
        type_name: formValue,
        product_category_id: selectedCategory,
      })
      toast.success("Tipo de producto creado correctamente")
      setCreateModalOpen(false)
      resetForm()
      loadTypes()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al crear el tipo")
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingType || !formValue.trim() || selectedCategory === null) return
    try {
      await updateProductType(editingType.product_type_id, {
        type_name: formValue,
        product_category_id: selectedCategory,
      })
      toast.success("Tipo de producto actualizado correctamente")
      setEditModalOpen(false)
      setEditingType(null)
      setFormValue("")
      setSelectedCategory(null)
      loadTypes()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al actualizar el tipo")
    }
  }

  const handleDelete = (type: ProductType) => {
    setTypeToDelete(type)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!typeToDelete) return
    try {
      await deleteProductType(typeToDelete.product_type_id)
      toast.success("Tipo de producto eliminado correctamente")
      loadTypes()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al eliminar el tipo")
    } finally {
      setDeleteDialogOpen(false)
      setTypeToDelete(null)
    }
  }

  const openEditModal = (type: ProductType) => {
    setEditingType(type)
    setFormValue(type.type_name)
    setSelectedCategory(type.category?.product_category_id || null)
    setEditModalOpen(true)
  }

  const resetForm = () => {
    setFormValue("")
    setSelectedCategory(null)
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
              <p className="text-sm font-medium">Total Tipos</p>
              <h3 className="text-2xl font-bold">{productTypes.length}</h3>
            </div>
            <Tag className="h-8 w-8 text-primary" />
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
          <h1 className="text-3xl font-bold">Tipos de Productos</h1>
          <p className="text-muted-foreground">Gestiona los tipos de productos disponibles</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setCreateModalOpen(true)
          }}
          className="w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Tipo
        </Button>
      </div>

      {/* Search Section */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar tipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Types Grid */}
      {isLoading ? (
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Cargando tipos de productos...</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence>
            {filteredProductTypes.map((type) => (
              <motion.div
                key={type.product_type_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">{type.type_name}</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <Badge variant="secondary" className="mb-2">
                      Categoría: {type.category?.category_name || "Sin categoría"}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      ID: {type.product_type_id}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2 pt-3 border-t">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(type)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(type)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal de Creación */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Tipo de Producto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="createType">Nombre del Tipo</Label>
                <Input
                  id="createType"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder="Ingrese el nombre del tipo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="createCategory">Categoría</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={selectedCategory != null}
                      className="w-full justify-between"
                    >
                      {selectedCategory
                        ? categories.find((category) => category.product_category_id === selectedCategory)
                            ?.category_name
                        : "Seleccione una categoría"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar categoría..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron categorías.</CommandEmpty>
                        <CommandGroup>
                          {categories.map((category) => (
                            <CommandItem
                              key={category.product_category_id}
                              onSelect={() => {
                                setSelectedCategory(category.product_category_id)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedCategory === category.product_category_id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {category.category_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Crear Tipo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Edición */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tipo de Producto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editType">Nombre del Tipo</Label>
                <Input
                  id="editType"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder="Ingrese el nuevo nombre del tipo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCategory">Categoría</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={selectedCategory != null}
                      className="w-full justify-between"
                    >
                      {selectedCategory
                        ? categories.find((category) => category.product_category_id === selectedCategory)
                            ?.category_name
                        : "Seleccione una categoría"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar categoría..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron categorías.</CommandEmpty>
                        <CommandGroup>
                          {categories.map((category) => (
                            <CommandItem
                              key={category.product_category_id}
                              onSelect={() => {
                                setSelectedCategory(category.product_category_id)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedCategory === category.product_category_id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {category.category_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Actualizar Tipo</Button>
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
          <p>¿Está seguro que desea eliminar el tipo "{typeToDelete?.type_name}"?</p>
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

export default ProductTypePage

