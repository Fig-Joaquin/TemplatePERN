"use client";

import { useEffect, useState, useCallback } from "react";
import { Car, Search, Plus } from "lucide-react";
import { toast } from "react-toastify";
import type { Person, Vehicle, brand, model, Company } from "../types/interfaces";
import { VehicleCard } from "@/components/VehicleCard";
import { NumberInput } from "@/components/numberInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchVehicles, createVehicle, updateVehicle, deleteVehicle } from "@/services/vehicleService";
import { fetchPersonsClient } from "@/services/personService";
import { fetchCompanies } from "@/services/work/companiesList";
import { fetchVehicleBrands } from "@/services/VehicleBrandService";
import { fetchVehicleModels } from "@/services/VehicleModelService";
import { motion, AnimatePresence } from "framer-motion";

type ModalType = "create" | "edit" | "delete";

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [brands, setBrands] = useState<brand[]>([]);
  const [models, setModels] = useState<model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>("create");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [licensePlate, setLicensePlate] = useState("");
  const [year, setYear] = useState<number | undefined>(undefined);
  const [color, setColor] = useState("");
  const [mileage, setMileage] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState<brand | null>(null);
  const [selectedModel, setSelectedModel] = useState<model | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [vehicleStatus, setVehicleStatus] = useState("running");
  const [ownerType, setOwnerType] = useState<"person" | "company">("person");

  const vehicleStatusOptions = [
    { value: "running", label: "Funcionando" },
    { value: "not_running", label: "Averiado" },
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [vehiclesData, personsData, companiesData, brandsData, modelsData] = await Promise.all([
        fetchVehicles(),
        fetchPersonsClient(),
        fetchCompanies(),
        fetchVehicleBrands(),
        fetchVehicleModels(),
      ]);
      setVehicles(vehiclesData);
      setPersons(personsData);
      setCompanies(companiesData);
      setBrands(brandsData);
      setModels(modelsData);
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredVehicles = vehicles.filter((vehicle) =>
    vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Al abrir el modal, se inicializa el formulario.
  const openModal = (type: ModalType, vehicle?: Vehicle) => {
    setModalType(type);
    setSelectedVehicle(vehicle || null);
    setLicensePlate(vehicle?.license_plate || "");
    // Si vehicle?.year es null, asigna undefined para evitar enviar null en el PUT
    setYear(vehicle?.year ?? undefined);
    setColor(vehicle?.color || "");
    setMileage(vehicle?.mileage_history?.[vehicle.mileage_history.length - 1]?.current_mileage || 0);
    setSelectedBrand(
      brands.find((b) => b.vehicle_brand_id === vehicle?.model.brand.vehicle_brand_id) || null
    );
    setSelectedModel(
      models.find((m) => m.vehicle_model_id === vehicle?.model.vehicle_model_id) || null
    );
    if (vehicle) {
      if (vehicle.owner) {
        setOwnerType("person");
        setSelectedPerson(persons.find((p) => p.person_id === vehicle.owner!.person_id) || null);
        setSelectedCompany(null);
      } else if (vehicle.company) {
        setOwnerType("company");
        setSelectedCompany(companies.find((c) => c.company_id === vehicle.company!.company_id) || null);
        setSelectedPerson(null);
      }
    } else {
      setOwnerType("person");
      setSelectedPerson(null);
      setSelectedCompany(null);
    }
    setVehicleStatus(vehicle?.vehicle_status || "running");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedVehicle(null);
    setLicensePlate("");
    setYear(undefined); // Reset to undefined
    setColor("");
    setMileage(0);
    setSelectedBrand(null);
    setSelectedModel(null);
    setSelectedPerson(null);
    setSelectedCompany(null);
    setOwnerType("person");
    setVehicleStatus("running");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ownerType === "person" && !selectedPerson) {
      toast.error("Por favor, seleccione un propietario (persona)");
      return;
    }
    if (ownerType === "company" && !selectedCompany) {
      toast.error("Por favor, seleccione una empresa");
      return;
    }
    if (!selectedBrand || !selectedModel) {
      toast.error("Por favor, complete los campos de marca y modelo");
      return;
    }

    try {
      const vehicleData: any = {
        license_plate: licensePlate,
        vehicle_status: vehicleStatus as "running" | "not_running",
        vehicle_model_id: selectedModel.vehicle_model_id,
      };

      // Incluir el año solo si tiene valor (no undefined)
      if (year !== undefined && year !== null) {
        vehicleData.year = year;
      }

      if (color) {
        vehicleData.color = color;
      }

      // Según el ownerType, asignar la propiedad correspondiente sin enviar null
      if (ownerType === "person") {
        vehicleData.person_id = selectedPerson!.person_id;
      } else {
        vehicleData.company_id = selectedCompany!.company_id;
      }

      // Incluir mileageHistory solo si se ingresó un nuevo valor
      if (modalType === "create" || (modalType === "edit" && mileage > 0)) {
        vehicleData.mileageHistory = mileage;
      }

      if (modalType === "create") {
        await createVehicle(vehicleData);
        toast.success("Vehículo creado exitosamente");
      } else if (modalType === "edit" && selectedVehicle) {
        await updateVehicle(selectedVehicle.vehicle_id, vehicleData);
        toast.success("Vehículo actualizado exitosamente");
      }
      fetchData();
      closeModal();
    } catch (error: any) {
      console.error("Error saving vehicle:", error);
      toast.error(error.response?.data?.message || "Error al guardar el vehículo");
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedVehicle) {
      try {
        await deleteVehicle(selectedVehicle.vehicle_id);
        toast.success("Vehículo eliminado exitosamente");
        fetchData();
        closeModal();
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Error al eliminar el vehículo");
      }
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setYear(value === "" ? undefined : Number(value));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Car className="w-8 h-8" />
          Vehículos Registrados
        </h1>
        <Button onClick={() => openModal("create")} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Vehículo
        </Button>
      </div>

      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar vehículo por matrícula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Cargando vehículos...</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence>
            {filteredVehicles.map((vehicle) => (
              <motion.div
                key={vehicle.vehicle_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <VehicleCard
                  vehicle={vehicle}
                  onEdit={() => openModal("edit", vehicle)}
                  onDelete={() => openModal("delete", vehicle)}
                  showActions={true}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
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
              <p className="text-center">
                ¿Está seguro que desea eliminar el vehículo {selectedVehicle?.license_plate}?
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDeleteConfirm}>
                  Eliminar
                </Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Patente *</label>
                <Input
                  type="text"
                  value={licensePlate}
                  placeholder="AABB10"
                  onChange={(e) => setLicensePlate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Año (Opcional)</label>
                <Input
                  type="number"
                  value={year === undefined ? "" : year}
                  onChange={handleYearChange}
                  placeholder="No especificado"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Color (Opcional)</label>
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Kilometraje *</label>
                <NumberInput value={mileage} onChange={(value) => setMileage(value)} min={0} />
              </div>
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
                <label className="block text-sm mb-1">Tipo de propietario</label>
                <Select value={ownerType} onValueChange={(value) => setOwnerType(value as "person" | "company")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="person">Persona</SelectItem>
                    <SelectItem value="company">Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {ownerType === "person" ? (
                <div>
                  <label className="block text-sm mb-1">Propietario (Persona)</label>
                  <Select
                    value={selectedPerson?.person_id?.toString() || ""}
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
              ) : (
                <div>
                  <label className="block text-sm mb-1">Propietario (Empresa)</label>
                  <Select
                    value={selectedCompany?.company_id?.toString() || ""}
                    onValueChange={(value) =>
                      setSelectedCompany(companies.find((c) => c.company_id.toString() === value) || null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.company_id} value={company.company_id.toString()}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="block text-sm mb-1">Marca</label>
                <Select
                  value={selectedBrand?.vehicle_brand_id.toString() || ""}
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
                  value={selectedModel?.vehicle_model_id.toString() || ""}
                  onValueChange={(value) =>
                    setSelectedModel(models.find((m) => m.vehicle_model_id.toString() === value) || null)
                  }
                  disabled={!selectedBrand}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedBrand ? "Selecciona un modelo" : "Selecciona una marca primero"} />
                  </SelectTrigger>
                  <SelectContent>
                    {models
                      .filter((model) => model.brand.vehicle_brand_id === selectedBrand?.vehicle_brand_id)
                      .map((model) => (
                        <SelectItem key={model.vehicle_model_id} value={model.vehicle_model_id.toString()}>
                          {model.model_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit">{modalType === "create" ? "Crear" : "Modificar"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehiclesPage;
