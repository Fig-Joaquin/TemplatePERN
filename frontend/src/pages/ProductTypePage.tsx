"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { toast } from "react-toastify"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Tag, Search, ChevronRight } from "lucide-react"
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
  const [expandedTypes, setExpandedTypes] = useState<Set<number>>(new Set())

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

  const handleDelete = async (type: ProductType) => {
    if (window.confirm(`¿Está seguro de eliminar el tipo "${type.type_name}"?`)) {
      try {
        await deleteProductType(type.product_type_id)
        toast.success("Tipo de producto eliminado correctamente")
        loadTypes()
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Error al eliminar el tipo")
      }
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

  const toggleExpand = (typeId: number) => {
    setExpandedTypes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(typeId)) {
        newSet.delete(typeId)
      } else {
        newSet.add(typeId)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Tag className="w-8 h-8" />
          Tipos de Producto
        </h1>
        <Button
          onClick={() => {
            resetForm()
            setCreateModalOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Tipo
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="w-5 h-5 text-gray-500" />
        <Input
          type="text"
          placeholder="Buscar tipos de producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Cargando tipos de producto...</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredProductTypes.map((type) => (
              <motion.div
                key={type.product_type_id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-card rounded-lg shadow-md overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer flex justify-between items-center"
                  onClick={() => toggleExpand(type.product_type_id)}
                >
                  <h3 className="text-lg font-semibold">{type.type_name}</h3>
                  <ChevronRight
                    className={`transform transition-transform duration-200 ${
                      expandedTypes.has(type.product_type_id) ? "rotate-90" : ""
                    }`}
                  />
                </div>
                <AnimatePresence>
                  {expandedTypes.has(type.product_type_id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 pb-4"
                    >
                      <p className="text-sm text-muted-foreground mb-4">
                        Categoría: {type.category?.category_name || "Sin categoría"}
                      </p>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(type)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(type)}>
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
    </div>
  )
}

export default ProductTypePage

