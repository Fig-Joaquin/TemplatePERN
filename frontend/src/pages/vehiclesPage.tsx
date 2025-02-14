"use client"

import { useEffect, useState } from "react"
import { Car, Search, Plus } from "lucide-react"
import api from "../utils/axiosConfig"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import type { Person, Vehicle, brand, model } from "../types/interfaces"
import { VehicleCard } from "@/components/VehicleCard"
import { NumberInput } from "@/components/numberInput"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ModalType = "create" | "edit" | "delete"

const VehiclesPage = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [persons, setPersons] = useState<Person[]>([])
    const [brands, setBrands] = useState<brand[]>([])
    const [models, setModels] = useState<model[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [modalOpen, setModalOpen] = useState(false)
    const [modalType, setModalType] = useState<ModalType>("create")
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
    const [licensePlate, setLicensePlate] = useState("")
    const [year, setYear] = useState(new Date().getFullYear())
    const [color, setColor] = useState("")
    const [mileage, setMileage] = useState(0)
    const [selectedBrand, setSelectedBrand] = useState<brand | null>(null)
    const [selectedModel, setSelectedModel] = useState<model | null>(null)
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
    const [vehicleStatus, setVehicleStatus] = useState("Funcionando")
    const vehicleStatusOptions = [
        { value: "running", label: "Funcionando" },
        { value: "not_running", label: "Averiado" },
    ]

    const filteredVehicles = vehicles.filter((vehicle) =>
        vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const openModal = (type: ModalType, vehicle?: Vehicle) => {
        setModalType(type)
        if (type === "edit" || type === "delete") {
            setSelectedVehicle(vehicle || null)
            setLicensePlate(vehicle?.license_plate || "")
            setYear(vehicle?.year || new Date().getFullYear())
            setColor(vehicle?.color || "")
            setMileage(((vehicle?.mileage_history?.[vehicle.mileage_history.length - 1]) as any)?.mileage || 0)
            setSelectedBrand(brands.find((b) => b.vehicle_brand_id === vehicle?.model.brand.vehicle_brand_id) || null)
            setSelectedModel(models.find((m) => m.vehicle_model_id === vehicle?.model?.vehicle_model_id) || null)
            setSelectedPerson(persons.find((p) => p.person_id === vehicle?.owner?.person_id) || null)
            setVehicleStatus(vehicle?.vehicle_status || "Disponible")
        } else {
            setSelectedVehicle(null)
            setLicensePlate("")
            setYear(new Date().getFullYear())
            setColor("")
            setMileage(0)
            setSelectedBrand(null)
            setSelectedModel(null)
            setSelectedPerson(null)
            setVehicleStatus("Disponible")
        }
        setModalOpen(true)
    }

    const closeModal = () => {
        setModalOpen(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (modalType === "create") {
                await api.post("/vehicles", {
                    license_plate: licensePlate,
                    year: year,
                    color: color,
                    mileageHistory: [mileage],
                    vehicle_brand_id: selectedBrand?.vehicle_brand_id,
                    vehicle_model_id: selectedModel?.vehicle_model_id,
                    person_id: selectedPerson?.person_id,
                    vehicle_status: vehicleStatus,
                })
                toast.success("Vehículo creado correctamente")
            } else {
                await api.put(`/vehicles/${selectedVehicle?.vehicle_id}`, {
                    license_plate: licensePlate,
                    year: year,
                    color: color,
                    mileageHistory: [mileage],
                    vehicle_brand_id: selectedBrand?.vehicle_brand_id,
                    vehicle_model_id: selectedModel?.vehicle_model_id,
                    person_id: selectedPerson?.person_id,
                    vehicle_status: vehicleStatus,
                })
                toast.success("Vehículo modificado correctamente")
            }
            fetchVehicles()
            closeModal()
        } catch (error: any) {
                    console.log(error)
                    toast.error(
                        [
                            error.response?.data?.message,
                            error.response?.data?.errors?.map((e: any) => e.message).join(", ")
                        ]
                            .filter(Boolean)
                            .join(", ") || 
                        "Error al guardar el vehículo"
                    );
                }
    }

    const handleDeleteConfirm = async () => {
        try {
            await api.delete(`/vehicles/${selectedVehicle?.vehicle_id}`)
            toast.success("Vehículo eliminado correctamente")
            fetchVehicles()
            closeModal()
        } catch (error: any) {
                    console.log(error)
                    toast.error(
                        [
                            error.response?.data?.message,
                            error.response?.data?.errors?.map((e: any) => e.message).join(", ")
                        ]
                            .filter(Boolean)
                            .join(", ") || 
                        "Error al eliminar el vehículo"
                    );
                }
    }

    const fetchVehicles = async () => {
        setLoading(true)
        try {
            const response = await api.get("/vehicles")
            setVehicles(response.data)
        } catch (error) {
            toast.error("Error al cargar los vehículos")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const fetchPersons = async () => {
        try {
            const response = await api.get("/persons")
            setPersons(response.data)
        } catch (error) {
            toast.error("Error al cargar las personas")
            console.error(error)
        }
    }

    const fetchBrands = async () => {
        try {
            const response = await api.get("/vehicleBrands")
            setBrands(response.data)
        } catch (error) {
            toast.error("Error al cargar las marcas")
            console.error(error)
        }
    }

    const fetchModels = async () => {
        try {
            const response = await api.get("/vehicleModels")
            setModels(response.data)
        } catch (error) {
            toast.error("Error al cargar los modelos")
            console.error(error)
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            await fetchVehicles()
            await fetchPersons()
            await fetchBrands()
            await fetchModels()
        }
        fetchData()
    }, [])

    return (
        <div className="p-6">
            {/* Cabecera */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Car className="w-6 h-6" />
                    Vehículos Registrados
                </h1>
                <Button onClick={() => openModal("create")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Vehículo
                </Button>
            </div>

            {/* Buscador y Tabla */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        <div className="relative">
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                            <Input
                                type="text"
                                placeholder="Buscar vehículo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4">Cargando vehículos...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredVehicles.map((vehicle) => (
                                <VehicleCard                   
                                key={vehicle.vehicle_id}
                                vehicle={vehicle}
                                onEdit={() => openModal("edit", vehicle)}
                                onDelete={() => openModal("delete", vehicle)}
                                showActions={true} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal */}
            <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {modalType === "create"
                                ? "Nuevo Vehículo"
                                : modalType === "edit"
                                    ? "Editar Vehículo"
                                    : "Confirmar eliminación"}
                        </DialogTitle>
                    </DialogHeader>
                    {modalType === "delete" ? (
                        <>
                            <p>¿Está seguro que desea eliminar el vehículo {selectedVehicle?.license_plate}?</p>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={closeModal}>
                                    Cancelar
                                </Button>
                                <Button variant="destructive" onClick={handleDeleteConfirm}>
                                    Eliminar
                                </Button>
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm mb-1">Placa</label>
                                    <Input type="text" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Año</label>
                                    <input
                                            type="number"
                                            value={year}
                                            onChange={(e) => setYear(Number(e.target.value))}
                                            className="w-full border rounded p-2 bg-white text-gray-900"
                                            required
                                        />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Color</label>
                                    <Input
                                        type="text"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Kilometraje</label>
                                    <NumberInput value={mileage} onChange={(value) => setMileage(value)} min={0} />
                                </div>
                                {modalType === "create" && (
                                    <>
                                        <div>
                                            <label className="block text-sm mb-1">Estado del vehículo</label>
                                            <Select value={vehicleStatus} onValueChange={setVehicleStatus}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona un estado" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {vehicleStatusOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="block text-sm mb-1">Marca</label>
                                            <Select
                                                value={selectedBrand?.vehicle_brand_id.toString()}
                                                onValueChange={(value) =>
                                                    setSelectedBrand(brands.find((b) => b.vehicle_brand_id.toString() === value) || null)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona una marca" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {brands.map((brand) => (
                                                        <SelectItem key={brand.vehicle_brand_id} value={brand.vehicle_brand_id.toString()}>
                                                            {brand.brand_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="block text-sm mb-1">Modelo</label>
                                            <Select
                                                value={selectedModel?.vehicle_model_id.toString()}
                                                onValueChange={(value) =>
                                                    setSelectedModel(models.find((m) => m.vehicle_model_id.toString() === value) || null)
                                                }
                                                disabled={!selectedBrand}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue
                                                        placeholder={selectedBrand ? "Selecciona un modelo" : "Selecciona una marca primero"}
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {models.map((model) => (
                                                        <SelectItem key={model.vehicle_model_id} value={model.vehicle_model_id.toString()}>
                                                            {model.model_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="block text-sm mb-1">Propietario</label>
                                            <Select
                                                value={selectedPerson?.person_id.toString()}
                                                onValueChange={(value) =>
                                                    setSelectedPerson(persons.find((p) => p.person_id.toString() === value) || null)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona un propietario" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {persons.map((person) => (
                                                        <SelectItem key={person.person_id} value={person.person_id.toString()}>
                                                            {`${person.name} ${person.first_surname}`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button type="button" variant="outline" onClick={closeModal}>
                                    Cancelar
                                </Button>
                                <Button type="submit">{modalType === "create" ? "Crear" : "Modificar"}</Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default VehiclesPage

