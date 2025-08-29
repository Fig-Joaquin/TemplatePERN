"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Car, Save, ArrowLeft, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NumberInput } from "@/components/numberInput";
import ClientForm from "@/components/clientForm";
import CompanyForm from "@/components/CompanyForm";
import {
  fetchVehicleId,
  createVehicle,
  updateVehicle
} from "@/services/vehicleService";
import { fetchPersonsClient, createPerson } from "@/services/personService";
import { fetchCompanies, createCompany } from "@/services/work/companiesList";
import { fetchVehicleBrands } from "@/services/VehicleBrandService";
import { fetchVehicleModels } from "@/services/VehicleModelService";
import type { Person, Vehicle, Brand, Model, Company } from "@/types/interfaces";

export default function VehicleFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [persons, setPersons] = useState<Person[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<{
    license_plate: string;
    year: number | undefined;
    color: string;
    mileage: number;
    vehicle_brand_id: string;
    vehicle_model_id: string;
    owner_type: "person" | "company";
    person_id: string;
    company_id: string;
    vehicle_status: "running" | "not_running";
  }>({
    license_plate: "",
    year: undefined,
    color: "",
    mileage: 0,
    vehicle_brand_id: "",
    vehicle_model_id: "",
    owner_type: "person",
    person_id: "",
    company_id: "",
    vehicle_status: "running",
  });

  // Estados para búsqueda
  const [personSearchTerm, setPersonSearchTerm] = useState("");
  const [companySearchTerm, setCompanySearchTerm] = useState("");

  // Estados para modales de creación
  const [createPersonModalOpen, setCreatePersonModalOpen] = useState(false);
  const [createCompanyModalOpen, setCreateCompanyModalOpen] = useState(false);
  const [, setCreatingPerson] = useState(false);
  const [creatingCompany, setCreatingCompany] = useState(false);

  // Estados para formularios de creación
  const [newPersonData, setNewPersonData] = useState({
    rut: "",
    name: "",
    first_surname: "",
    second_surname: "",
    email: "",
    number_phone: "",
    person_type: "cliente"
  });

  const [newCompanyData, setNewCompanyData] = useState({
    rut: "",
    name: "",
    email: "",
    phone: ""
  });

  const vehicleStatusOptions = [
    { value: "running", label: "Funcionando" },
    { value: "not_running", label: "Averiado" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Cargar datos necesarios
        const [personsData, companiesData, brandsData, modelsData] = await Promise.all([
          fetchPersonsClient(),
          fetchCompanies(),
          fetchVehicleBrands(),
          fetchVehicleModels(),
        ]);

        setPersons(personsData);
        setCompanies(companiesData);
        setBrands(brandsData);
        setModels(modelsData);

        // Si estamos en modo edición, cargar los datos del vehículo
        if (isEditMode) {
          const vehicleData = await fetchVehicleId(parseInt(id));
          setFormData({
            license_plate: vehicleData.license_plate || "",
            year: vehicleData.year ?? undefined,
            color: vehicleData.color || "",
            mileage: vehicleData.mileage_history?.[vehicleData.mileage_history.length - 1]?.current_mileage || 0,
            vehicle_brand_id: vehicleData.model?.brand?.vehicle_brand_id?.toString() || "",
            vehicle_model_id: vehicleData.model?.vehicle_model_id?.toString() || "",
            owner_type: vehicleData.owner ? "person" : "company",
            person_id: vehicleData.owner?.person_id?.toString() || "",
            company_id: vehicleData.company?.company_id?.toString() || "",
            vehicle_status: vehicleData.vehicle_status || "running",
          });
        } else {
          // Si estamos creando un nuevo vehículo y hay un person_id o company_id en la URL, preseleccionarlo
          const personIdFromUrl = searchParams.get("person_id");
          const companyIdFromUrl = searchParams.get("company_id");

          if (personIdFromUrl) {
            setFormData(prev => ({
              ...prev,
              owner_type: "person",
              person_id: personIdFromUrl,
              company_id: ""
            }));
          } else if (companyIdFromUrl) {
            setFormData(prev => ({
              ...prev,
              owner_type: "company",
              person_id: "",
              company_id: companyIdFromUrl
            }));
          }
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast.error("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name: string, value: number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOwnerTypeChange = (value: "person" | "company") => {
    setFormData(prev => ({
      ...prev,
      owner_type: value,
      person_id: "",
      company_id: ""
    }));
  };

  // Funciones para manejar la creación de personas
  const handlePersonInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPersonData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingPerson(true);
      const response = await createPerson(newPersonData);

      // Manejar diferentes estructuras de respuesta del API
      const newPerson = response.data?.person || response.data || response;

      // Actualizar la lista de personas
      setPersons(prev => [...prev, newPerson]);


      // Seleccionar automáticamente la nueva persona
      setFormData(prev => ({ ...prev, person_id: newPerson.person_id.toString() }));

      // Limpiar el formulario y cerrar el modal
      setNewPersonData({
        rut: "",
        name: "",
        first_surname: "",
        second_surname: "",
        email: "",
        number_phone: "",
        person_type: "cliente"
      });

      // Luego cerrar el modal
      setCreatePersonModalOpen(false);

      // IMPORTANTE: Actualizar la selección después de un pequeño retraso
      // para asegurar que el UI se ha actualizado correctamente
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          person_id: newPerson.person_id.toString()
        }));
        toast.success("Cliente creado exitosamente y seleccionado automáticamente");
      }, 100);

    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Error al crear cliente"
      );
    } finally {
      setCreatingPerson(false);
    }
  };

  // Funciones para manejar la creación de empresas
  const handleCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCompanyData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingCompany(true);
      const response = await createCompany(newCompanyData);

      // Manejar diferentes estructuras de respuesta del API
      const newCompany = response;

      // Actualizar la lista de empresas
      setCompanies(prev => [...prev, newCompany]);


      // Seleccionar automáticamente la nueva empresa
      setFormData(prev => ({ ...prev, company_id: newCompany.company_id.toString() }));

      // Limpiar el formulario y cerrar el modal
      setNewCompanyData({
        rut: "",
        name: "",
        email: "",
        phone: ""
      });

      // Luego cerrar el modal
      setCreateCompanyModalOpen(false);

      // IMPORTANTE: Actualizar la selección después de un pequeño retraso
      // para asegurar que el UI se ha actualizado correctamente
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          company_id: newCompany.company_id.toString()
        }));
        toast.success("Empresa creada exitosamente y seleccionada automáticamente");
      }, 100);

    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Error al crear empresa"
      );
    } finally {
      setCreatingCompany(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !formData.license_plate ||
      !formData.vehicle_brand_id ||
      !formData.vehicle_model_id ||
      (formData.owner_type === "person" && !formData.person_id) ||
      (formData.owner_type === "company" && !formData.company_id)
    ) {
      toast.error("Por favor complete todos los campos obligatorios");
      return;
    }

    try {
      setSubmitting(true);

      const vehicleData: Partial<Vehicle> = {
        license_plate: formData.license_plate,
        year: formData.year,
        color: formData.color,
        vehicle_model_id: parseInt(formData.vehicle_model_id),
        vehicle_status: formData.vehicle_status,
        ...(formData.owner_type === "person"
          ? { person_id: parseInt(formData.person_id) }
          : { company_id: parseInt(formData.company_id) }
        ),
        // Agregar kilometraje tanto en creación como en edición
        mileageHistory: formData.mileage
      };

      if (isEditMode) {
        await updateVehicle(parseInt(id), vehicleData);
        toast.success("Vehículo actualizado correctamente");
      } else {
        await createVehicle(vehicleData);
        toast.success("Vehículo creado correctamente");
      }

      navigate("/admin/vehiculos");
    } catch (error: any) {
      console.error("Error al guardar vehículo:", error);
      toast.error(
        error.response?.data?.message ||
        "Error al guardar el vehículo"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrar modelos basado en la marca seleccionada
  const filteredModels = models.filter(model =>
    formData.vehicle_brand_id ?
      model.brand?.vehicle_brand_id?.toString() === formData.vehicle_brand_id :
      true
  );

  // Filtrado de personas
  const filteredPersons = persons.filter((person) => {
    const searchValue = personSearchTerm.toLowerCase();
    return (
      person.name?.toLowerCase().includes(searchValue) ||
      person.first_surname?.toLowerCase().includes(searchValue) ||
      person.second_surname?.toLowerCase().includes(searchValue) ||
      person.rut?.toLowerCase().includes(searchValue) ||
      person.number_phone?.toLowerCase().includes(searchValue)
    );
  }).sort((a, b) => {
    // Ordenar alfabéticamente por nombre
    return `${a.name} ${a.first_surname}`.localeCompare(`${b.name} ${b.first_surname}`);
  });

  // Filtrado de empresas
  const filteredCompanies = companies.filter((company) => {
    const searchValue = companySearchTerm.toLowerCase();
    return (
      company.name?.toLowerCase().includes(searchValue) ||
      company.rut?.toLowerCase().includes(searchValue) ||
      company.phone?.toLowerCase().includes(searchValue)
    );
  }).sort((a, b) => {
    // Ordenar alfabéticamente por nombre
    return a.name.localeCompare(b.name);
  });

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-lg text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="container mx-auto p-6 max-w-4xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/vehiculos")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Car className="h-8 w-8" />
          {isEditMode ? "Editar Vehículo" : "Nuevo Vehículo"}
        </h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica del vehículo */}
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <h3 className="text-lg font-semibold text-primary mb-1">Información del Vehículo</h3>
                <p className="text-sm text-gray-600">Complete los datos técnicos y características del vehículo</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="license_plate" className="text-sm font-medium text-gray-700">
                    Patente <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="license_plate"
                    name="license_plate"
                    value={formData.license_plate}
                    onChange={handleChange}
                    placeholder="ABC123"
                    required
                    className="uppercase transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <Label htmlFor="year">Año</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    value={formData.year || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      const maxYear = new Date().getFullYear() + 1;

                      // Permitir campo vacío
                      if (value === "") {
                        setFormData(prev => ({ ...prev, year: undefined }));
                        return;
                      }

                      // Limitar a 4 dígitos máximo
                      if (value.length > 4) {
                        return;
                      }

                      const numValue = parseInt(value);

                      // Permitir valores parciales mientras se escribe
                      if (value.length < 4) {
                        setFormData(prev => ({ ...prev, year: numValue }));
                        return;
                      }

                      // Solo validar rango cuando tiene 4 dígitos
                      if (!isNaN(numValue) && numValue >= 1900 && numValue <= maxYear) {
                        setFormData(prev => ({ ...prev, year: numValue }));
                      }
                    }}
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    placeholder="2023"
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="Rojo"
                  />
                </div>

                <div>
                  <Label htmlFor="mileage">Kilometraje</Label>
                  <NumberInput
                    id="mileage"
                    value={formData.mileage}
                    onChange={(value) => handleNumberChange("mileage", value)}
                    min={0}
                    placeholder="50000"
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="vehicle_brand_id">Marca*</Label>
                  <Select
                    value={formData.vehicle_brand_id}
                    onValueChange={(value) => {
                      handleSelectChange("vehicle_brand_id", value);
                      // Limpiar modelo cuando se cambia la marca
                      handleSelectChange("vehicle_model_id", "");
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.vehicle_brand_id} value={brand.vehicle_brand_id!.toString()}>
                          {brand.brand_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vehicle_model_id">Modelo*</Label>
                  <Select
                    value={formData.vehicle_model_id}
                    onValueChange={(value) => handleSelectChange("vehicle_model_id", value)}
                    required
                    disabled={!formData.vehicle_brand_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredModels.map((model) => (
                        <SelectItem key={model.vehicle_model_id} value={model.vehicle_model_id!.toString()}>
                          {model.model_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!formData.vehicle_brand_id && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Primero seleccione una marca
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="vehicle_status">Estado del Vehículo</Label>
                  <Select
                    value={formData.vehicle_status}
                    onValueChange={(value) => handleSelectChange("vehicle_status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el estado" />
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
              </div>
            </div>

            {/* Información del propietario */}
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <h3 className="text-lg font-semibold text-primary mb-1">Información del Propietario</h3>
                <p className="text-sm text-gray-600">Seleccione el tipo de propietario y complete los datos correspondientes</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Tipo de Propietario <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.owner_type}
                  onValueChange={handleOwnerTypeChange}
                  required
                >
                  <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="person">👤 Persona Natural</SelectItem>
                    <SelectItem value="company">🏢 Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.owner_type === "person" ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="person_id">Cliente*</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCreatePersonModalOpen(true)}
                      className="text-xs h-8 px-3 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Crear Cliente
                    </Button>
                  </div>
                  <Select
                    value={formData.person_id}
                    onValueChange={(value) => handleSelectChange("person_id", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un cliente">
                        {formData.person_id && (
                          (() => {
                            const selectedPerson = persons.find(person => person.person_id?.toString() === formData.person_id);
                            if (selectedPerson) {
                              return (
                                <span className="truncate">
                                  {selectedPerson.name} {selectedPerson.first_surname} - {selectedPerson.rut}
                                </span>
                              );
                            }
                            return formData.person_id;
                          })()
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      <div className="p-3 sticky top-0 bg-card z-10 border-b">
                        <Input
                          type="text"
                          placeholder="Buscar por nombre, RUT, teléfono..."
                          value={personSearchTerm}
                          onChange={(e) => setPersonSearchTerm(e.target.value)}
                          className="mb-0"
                        />
                      </div>
                      {filteredPersons.length > 0 ? (
                        filteredPersons.map((person) => (
                          <SelectItem key={person.person_id} value={person.person_id!.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {person.name} {person.first_surname} {person.second_surname}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                RUT: {person.rut} | Tel: {person.number_phone}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-center text-muted-foreground">
                          No se encontraron clientes
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="company_id">Empresa*</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCreateCompanyModalOpen(true)}
                      className="text-xs h-8 px-3 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Crear Empresa
                    </Button>
                  </div>
                  <Select
                    value={formData.company_id}
                    onValueChange={(value) => handleSelectChange("company_id", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una empresa">
                        {formData.company_id && (
                          (() => {
                            const selectedCompany = companies.find(company => company.company_id?.toString() === formData.company_id);
                            if (selectedCompany) {
                              return (
                                <span className="truncate">
                                  {selectedCompany.name} - {selectedCompany.rut}
                                </span>
                              );
                            }
                            return formData.company_id;
                          })()
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      <div className="p-3 sticky top-0 bg-card z-10 border-b">
                        <Input
                          type="text"
                          placeholder="Buscar por nombre, RUT, teléfono..."
                          value={companySearchTerm}
                          onChange={(e) => setCompanySearchTerm(e.target.value)}
                          className="mb-0"
                        />
                      </div>
                      {filteredCompanies.length > 0 ? (
                        filteredCompanies.map((company) => (
                          <SelectItem key={company.company_id} value={company.company_id!.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{company.name}</span>
                              <span className="text-sm text-muted-foreground">
                                RUT: {company.rut} | Tel: {company.phone}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-center text-muted-foreground">
                          No se encontraron empresas
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/vehiculos")}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent mr-2"></span>
                    {isEditMode ? "Actualizando..." : "Guardando..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? "Actualizar" : "Guardar"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modal para crear cliente */}
      <Dialog open={createPersonModalOpen} onOpenChange={setCreatePersonModalOpen}>
        <DialogContent className="max-w-lg mx-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              Crear Nuevo Cliente
            </DialogTitle>
            <p className="text-sm text-gray-600">
              Complete los datos del cliente. Los campos marcados con * son obligatorios.
            </p>
          </DialogHeader>
          <div className="mt-4">
            <ClientForm
              formData={newPersonData}
              handleInputChange={handlePersonInputChange}
              handleSubmit={handleCreatePerson}
              onCancel={() => setCreatePersonModalOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para crear empresa */}
      <Dialog open={createCompanyModalOpen} onOpenChange={setCreateCompanyModalOpen}>
        <DialogContent className="max-w-lg mx-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              Crear Nueva Empresa
            </DialogTitle>
            <p className="text-sm text-gray-600">
              Complete los datos de la empresa. Los campos marcados con * son obligatorios.
            </p>
          </DialogHeader>
          <div className="mt-4">
            <CompanyForm
              formData={newCompanyData}
              handleInputChange={handleCompanyInputChange}
              handleSubmit={handleCreateCompany}
              onCancel={() => setCreateCompanyModalOpen(false)}
              isCreating={creatingCompany}
            />
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
