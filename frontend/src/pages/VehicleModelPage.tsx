"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  fetchVehicleModels,
  createVehicleModel,
  updateVehicleModel,
  deleteVehicleModel,
} from "../services/VehicleModelService"
import { fetchVehicleBrands } from "../services/VehicleBrandService"
import type { model, brand } from "../types/interfaces"
import { Plus, Edit, Trash2, Search, Car, Calendar, Settings } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"

const VehicleModelPage = () => {
  const [models, setModels] = useState<model[]>([])
  const [brands, setBrands] = useState<brand[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [modelName, setModelName] = useState("")
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null)
  const [editingModel, setEditingModel] = useState<model | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBrandId, setFilterBrandId] = useState<number | null>(null)
  const [openCreateBrandCombobox, setOpenCreateBrandCombobox] = useState(false)
  const [openEditBrandCombobox, setOpenEditBrandCombobox] = useState(false)

  useEffect(() => {
    loadModels()
    loadBrands()
  }, [])

  const loadModels = async () => {
    setIsLoading(true)
    try {
      const data = await fetchVehicleModels()
      setModels(data)
    } catch (error) {
      toast.error("Error al cargar los modelos de vehículos")
    } finally {
      setIsLoading(false)
    }
  }

  const loadBrands = async () => {
    try {
      const data = await fetchVehicleBrands()
      setBrands(data)
    } catch (error) {
      toast.error("Error al cargar las marcas de vehículos")
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modelName.trim() || !selectedBrandId) {
      toast.error("El nombre del modelo y la marca son obligatorios")
      return
    }
    try {
      await createVehicleModel({ model_name: modelName, vehicle_brand_id: selectedBrandId })
      toast.success("Modelo de vehículo creado exitosamente")
      setIsCreateModalOpen(false)
      resetForm()
      loadModels()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al crear el modelo")
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingModel || !modelName.trim() || !selectedBrandId) return
    try {
      await updateVehicleModel(editingModel.vehicle_model_id, {
        model_name: modelName,
        vehicle_brand_id: selectedBrandId,
      })
      toast.success("Modelo de vehículo actualizado correctamente")
      setIsEditModalOpen(false)
      setEditingModel(null)
      resetForm()
      loadModels()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al actualizar el modelo")
    }
  }

  const handleDelete = async (model: model) => {
    if (window.confirm(`¿Está seguro de eliminar el modelo "${model.model_name}"?`)) {
      try {
        await deleteVehicleModel(model.vehicle_model_id)
        toast.success("Modelo de vehículo eliminado correctamente")
        loadModels()
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Error al eliminar el modelo")
      }
    }
  }

  const resetForm = () => {
    setModelName("")
    setSelectedBrandId(null)
  }

  const openEditModal = (model: model) => {
    setEditingModel(model)
    setModelName(model.model_name)
    setSelectedBrandId(model.brand.vehicle_brand_id)
    setIsEditModalOpen(true)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-primary/10">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium">Total Modelos</p>
              <h3 className="text-2xl font-bold">{models.length}</h3>
            </div>
            <Settings className="h-8 w-8 text-primary" />
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
          <h1 className="text-3xl font-bold">Modelos de Vehículos</h1>
          <p className="text-muted-foreground">Gestiona los modelos de vehículos disponibles</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setIsCreateModalOpen(true)
          }}
          className="w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Modelo
        </Button>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-[200px] justify-between">
              {filterBrandId
                ? brands.find(b => b.vehicle_brand_id === filterBrandId)?.brand_name
                : "Filtrar por marca"}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Buscar marca..." />
              <CommandList>
                <CommandEmpty>No se encontraron marcas.</CommandEmpty>
                <CommandGroup>
                  <CommandItem onSelect={() => setFilterBrandId(null)}>
                    <Check className={cn("mr-2 h-4 w-4", !filterBrandId ? "opacity-100" : "opacity-0")} />
                    Todas las marcas
                  </CommandItem>
                  {brands.map((brand) => (
                    <CommandItem
                      key={brand.vehicle_brand_id}
                      onSelect={() => setFilterBrandId(brand.vehicle_brand_id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          filterBrandId === brand.vehicle_brand_id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {brand.brand_name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Models Grid */}
      {isLoading ? (
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Cargando modelos de vehículos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models
            .filter(
              (model) =>
                model.model_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                (!filterBrandId || model.brand.vehicle_brand_id === filterBrandId)
            )
            .map((model) => (
              <Card key={model.vehicle_model_id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">{model.model_name}</h3>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <Badge variant="secondary" className="mb-2">
                    Marca: {model.brand.brand_name}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    ID: {model.vehicle_model_id}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2 pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(model)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(model)}>
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
            <DialogTitle>Crear Nuevo Modelo de Vehículo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modelName">Nombre del Modelo</Label>
                <Input
                  id="modelName"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="Ingrese el nombre del modelo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brandSelect">Marca</Label>
                <Popover open={openCreateBrandCombobox} onOpenChange={setOpenCreateBrandCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCreateBrandCombobox}
                      className="w-full justify-between"
                    >
                      {selectedBrandId
                        ? brands.find((brand) => brand.vehicle_brand_id === selectedBrandId)?.brand_name
                        : "Seleccione una marca"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar marca..." />
                      <CommandList>
                        <CommandEmpty>No se encontró la marca.</CommandEmpty>
                        <CommandGroup>
                          {brands.map((brand) => (
                            <CommandItem
                              key={brand.vehicle_brand_id}
                              onSelect={() => {
                                setSelectedBrandId(brand.vehicle_brand_id)
                                setOpenCreateBrandCombobox(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedBrandId === brand.vehicle_brand_id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {brand.brand_name}
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
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Crear Modelo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Modelo de Vehículo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editModelName">Nombre del Modelo</Label>
                <Input
                  id="editModelName"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="Ingrese el nuevo nombre del modelo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editBrandSelect">Marca</Label>
                <Popover open={openEditBrandCombobox} onOpenChange={setOpenEditBrandCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openEditBrandCombobox}
                      className="w-full justify-between"
                    >
                      {selectedBrandId
                        ? brands.find((brand) => brand.vehicle_brand_id === selectedBrandId)?.brand_name
                        : "Seleccione una marca"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar marca..." />
                      <CommandList>
                        <CommandEmpty>No se encontró la marca.</CommandEmpty>
                        <CommandGroup>
                          {brands.map((brand) => (
                            <CommandItem
                              key={brand.vehicle_brand_id}
                              onSelect={() => {
                                setSelectedBrandId(brand.vehicle_brand_id)
                                setOpenEditBrandCombobox(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedBrandId === brand.vehicle_brand_id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {brand.brand_name}
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
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Actualizar Modelo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default VehicleModelPage

