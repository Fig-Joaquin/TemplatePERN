"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { Card, CardHeader, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    fetchVehicleBrands,
    createVehicleBrand,
    updateVehicleBrand,
    deleteVehicleBrand,
} from "../services/VehicleBrandService"
import type { brand } from "../types/interfaces"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

const VehicleBrandPage = () => {
    const [brands, setBrands] = useState<brand[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [brandName, setBrandName] = useState("")
    const [editingBrand, setEditingBrand] = useState<brand | null>(null)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        loadBrands()
    }, [])

    const loadBrands = async () => {
        setIsLoading(true)
        try {
            const data = await fetchVehicleBrands()
            setBrands(data)
        } catch (error) {
            toast.error("Error al cargar las marcas de vehículos")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!brandName.trim()) {
            toast.error("El nombre de la marca es obligatorio")
            return
        }
        try {
            await createVehicleBrand({ brand_name: brandName })
            toast.success("Marca de vehículo creada exitosamente")
            setIsCreateModalOpen(false)
            resetForm()
            loadBrands()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al crear la marca")
        }
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingBrand || !brandName.trim()) return
        try {
            await updateVehicleBrand(editingBrand.vehicle_brand_id, { brand_name: brandName })
            toast.success("Marca de vehículo actualizada correctamente")
            setIsEditModalOpen(false)
            setEditingBrand(null)
            setBrandName("")
            loadBrands()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al actualizar la marca")
        }
    }

    const handleDelete = async (brand: brand) => {
        if (window.confirm(`¿Está seguro de eliminar la marca "${brand.brand_name}"?`)) {
            try {
                await deleteVehicleBrand(brand.vehicle_brand_id)
                toast.success("Marca de vehículo eliminada correctamente")
                loadBrands()
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Error al eliminar la marca")
            }
        }
    }

    const resetForm = () => {
        setBrandName("")
    }

    const openEditModal = (brand: brand) => {
        setEditingBrand(brand)
        setBrandName(brand.brand_name)
        setIsEditModalOpen(true)
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Marcas de Vehículos</h1>
                <Button
                    onClick={() => {
                        resetForm()
                        setIsCreateModalOpen(true)
                    }}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Marca
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                    type="text"
                    placeholder="Buscar marca..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                />
            </div>

            {isLoading ? (
                <div className="text-center">Cargando marcas de vehículos...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {brands
                        .filter((brand) => brand.brand_name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((brand) => (
                            <Card key={brand.vehicle_brand_id} className="shadow-md">
                                <CardHeader className="font-semibold">{brand.brand_name}</CardHeader>
                                <CardFooter className="flex justify-end space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => openEditModal(brand)}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Editar
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(brand)}>
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
                        <DialogTitle>Crear Nueva Marca de Vehículo</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit}>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="brandName">Nombre de la Marca</Label>
                                <Input
                                    id="brandName"
                                    value={brandName}
                                    onChange={(e) => setBrandName(e.target.value)}
                                    placeholder="Ingrese el nombre de la marca"
                                />
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">Crear Marca</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal de Edición */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Marca de Vehículo</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit}>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="editBrandName">Nombre de la Marca</Label>
                                <Input
                                    id="editBrandName"
                                    value={brandName}
                                    onChange={(e) => setBrandName(e.target.value)}
                                    placeholder="Ingrese el nuevo nombre de la marca"
                                />
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">Actualizar Marca</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default VehicleBrandPage

