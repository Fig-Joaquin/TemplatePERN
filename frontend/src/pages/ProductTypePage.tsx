"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { Card, CardHeader, CardFooter, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Edit, Trash2 } from "lucide-react"
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

const ProductTypePage = () => {
    const [productTypes, setProductTypes] = useState<ProductType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [formValue, setFormValue] = useState("")
    const [editingType, setEditingType] = useState<ProductType | null>(null)

    const [categories, setCategories] = useState<category[]>([])
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

    const loadTypes = async () => {
        setIsLoading(true)
        try {
            const data = await fetchProductTypes()
            setProductTypes(data)
        } catch (error) {
            toast.error("Error al cargar los tipos de producto")
        } finally {
            setIsLoading(false)
        }
    }

    const loadCategories = async () => {
        try {
            const data = await fetchProductCategories()
            setCategories(data)
        } catch (error) {
            toast.error("Error al cargar las categorías")
        }
    }

    useEffect(() => {
        loadTypes()
        loadCategories()
    }, [])

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

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Tipos de Producto</h1>
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

            {isLoading ? (
                <div className="text-center py-4">Cargando tipos de producto...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {productTypes.map((pt) => (
                        <Card key={pt.product_type_id} className="flex flex-col justify-between">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">{pt.type_name}</CardTitle>
                                <p className="text-sm text-muted-foreground">{pt.category?.category_name || "Sin categoría"}</p>
                            </CardHeader>
                            <CardFooter className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEditModal(pt)}>
                                    <Edit className="w-4 h-4 mr-1" />
                                    Editar
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(pt)}>
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Eliminar
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
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

