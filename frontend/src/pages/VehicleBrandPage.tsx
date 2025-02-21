"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  fetchVehicleBrands,
  createVehicleBrand,
  updateVehicleBrand,
  deleteVehicleBrand,
} from "../services/VehicleBrandService"
import{
  fetchVehicleModels,
} from "../services/VehicleModelService"
import type { brand, model } from "../types/interfaces"
import { Plus, Edit, Trash2, Search, Car, Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"

const VehicleBrandPage = () => {
  const [brands, setBrands] = useState<brand[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [brandName, setBrandName] = useState("")
  const [editingBrand, setEditingBrand] = useState<brand | null>(null)
  const [models, setModels] = useState<model[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadBrands()
    loadModels()
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


  const loadModels = async () => {
    try {
      const data = await fetchVehicleModels()
      setModels(data)
    } catch (error) {
      toast.error("Error al cargar los modelos de vehículos")
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
    <motion.div 
      className="container mx-auto p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Section with Stats */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="bg-primary/10">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium">Total Marcas</p>
              <h3 className="text-2xl font-bold">{brands.length}</h3>
            </div>
            <Car className="h-8 w-8 text-primary" />
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
      </motion.div>

      {/* Header with Actions */}
      <motion.div 
        className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <div>
          <h1 className="text-3xl font-bold">Marcas de Vehículos</h1>
          <p className="text-muted-foreground">Gestiona las marcas de vehículos disponibles</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setIsCreateModalOpen(true)
          }}
          className="w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Marca
        </Button>
      </motion.div>

      {/* Search Bar */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar marca..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Brands Grid */}
      {isLoading ? (
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Cargando marcas de vehículos...</p>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence>
            {brands
              .filter((brand) => brand.brand_name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((brand) => (
                <motion.div
                  key={brand.vehicle_brand_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Car className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">{brand.brand_name}</h3>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <Badge variant="secondary" className="mb-2">
                        ID: {brand.vehicle_brand_id}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {models.filter((m) => m.brand.vehicle_brand_id === brand.vehicle_brand_id).length > 0 
                          ? models
                              .filter((m) => m.brand.vehicle_brand_id === brand.vehicle_brand_id)
                              .map((m, i, arr) => (
                                <span key={m.vehicle_model_id}>
                                  {m.model_name}{i < arr.length - 1 ? ', ' : ''}
                                </span>
                              ))
                          : "Sin modelos registrados"}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2 pt-3 border-t">
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
                </motion.div>
              ))}
          </AnimatePresence>
        </motion.div>
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
    </motion.div>
  )
}

export default VehicleBrandPage

