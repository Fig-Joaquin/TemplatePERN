import { useEffect, useState, Fragment } from "react";
import { Dialog, Transition, Listbox } from "@headlessui/react";
import { Car, Edit, Trash2, Search, Plus, Check, ChevronsUpDown } from "lucide-react";
import api from "../utils/axiosConfig";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Tipos e Interfaces

interface MileageHistory {
    registration_date: string;
    current_mileage: number;
}

interface Person {
    person_id: number;
    name: string;
    first_surname: string;
}

interface Vehicle {
    vehicle_id: number;
    license_plate: string;
    year: number;
    color: string;
    model: {
        model_name: string;
        brand: {
            brand_name: string;
        };
    };
    owner: {
        person_id?: number;
        name: string;
        first_surname: string;
    };
    mileage_history: MileageHistory[];
}

interface VehicleBrand {
    vehicle_brand_id: number;
    brand_name: string;
    models: VehicleModel[];
}

interface VehicleModel {
    vehicle_model_id: number;
    vehicle_brand_id: number;
    model_name: string;
    brand: VehicleBrand;
}

type ModalType = "create" | "edit" | "delete";

// Componente OwnerListbox usando Headless UI Listbox
export const OwnerListbox = ({
    persons,
    selectedPerson,
    setSelectedPerson,
}: {
    persons: Person[];
    selectedPerson: Person | null;
    setSelectedPerson: (person: Person) => void;
}) => {
    return (
        <Listbox value={selectedPerson} onChange={setSelectedPerson}>
            {({ open }) => (
                <>
                    <Listbox.Button className="w-full border rounded p-2 bg-white text-gray-900 flex justify-between items-center">
                        <span>
                            {selectedPerson
                                ? `${selectedPerson.name} ${selectedPerson.first_surname}`
                                : "Selecciona un propietario"}
                        </span>
                        <ChevronsUpDown className="w-5 h-5" />
                    </Listbox.Button>
                    <Listbox.Options className="border rounded mt-1 max-h-60 overflow-auto bg-white">
                        {persons.map((person) => (
                            <Listbox.Option
                                key={person.person_id}
                                value={person}
                                className={({ active }) =>
                                    `cursor-pointer p-2 ${active ? "bg-blue-600 text-white" : "bg-white text-black"}`
                                }
                            >
                                {({ selected }) => (
                                    <div className="flex justify-between items-center">
                                        <span>
                                            {person.name} {person.first_surname}
                                        </span>
                                        {selected && <Check className="w-4 h-4" />}
                                    </div>
                                )}
                            </Listbox.Option>
                        ))}
                    </Listbox.Options>
                </>
            )}
        </Listbox>
    );
};

// Componente VehiclesPage
const VehiclesPage = () => {
    // Estados para vehículos y carga
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<ModalType | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [licensePlate, setLicensePlate] = useState("");
    const [year, setYear] = useState<number>(2020);
    const [color, setColor] = useState("");

    // Estado para el kilometraje
    const [mileage, setMileage] = useState<number>(0);

    // Estado para vehicle_status y sus opciones (mostrar en español)
    const [vehicleStatus, setVehicleStatus] = useState<string>("running");
    const vehicleStatusOptions = [
        { value: "running", label: "En funcionamiento" },
        { value: "not_running", label: "No en funcionamiento" },
    ];

    // Estados para propietarios
    const [persons, setPersons] = useState<Person[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

    // Estados para marcas y modelos
    const [brands, setBrands] = useState<VehicleBrand[]>([]);
    const [selectedBrand, setSelectedBrand] = useState<VehicleBrand | null>(null);
    const [models, setModels] = useState<VehicleModel[]>([]);
    const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);

    // Estado para controlar el historial de kilometraje expandido por vehículo
    const [expandedMileage, setExpandedMileage] = useState<{ [key: number]: boolean }>({});

    // Función para obtener vehículos
    const fetchVehicles = async () => {
        try {
            const response = await api.get("/vehicles");
            setVehicles(response.data);
        } catch (error: any) {
            toast.error(
                error.response?.data?.errors.map((e: any) => e.message).join(", ")
            );
        } finally {
            setLoading(false);
        }
    };

    // Función para obtener personas
    const fetchPersons = async () => {
        try {
            const response = await api.get("/persons");
            setPersons(response.data);
        } catch (error: any) {
            toast.error("Error al cargar las personas");
        }
    };

    // Función para obtener marcas (vehicle_brands)
    const fetchBrands = async () => {
        try {
            const response = await api.get("/vehicleBrands");
            setBrands(response.data);
        } catch (error: any) {
            toast.error("Error al cargar las marcas");
        }
    };

    // Función para obtener modelos (vehicle_models)
    const fetchModels = async () => {
        try {
            const response = await api.get("/vehicleModels");
            setModels(response.data);
        } catch (error: any) {
            toast.error("Error al cargar los modelos");
        }
    };

    useEffect(() => {
        fetchVehicles();
        fetchPersons();
        fetchBrands();
        fetchModels();
    }, []);

    // Función para abrir el modal (create, edit o delete)
    const openModal = (type: ModalType, vehicle: Vehicle | null = null) => {
        setModalType(type);
        setSelectedVehicle(vehicle);
        if (vehicle) {
            setLicensePlate(vehicle.license_plate);
            setYear(vehicle.year);
            setColor(vehicle.color);
            // Aquí podrías agregar la lógica para setear el estado del vehículo si ya está definido
        } else {
            setLicensePlate("");
            setYear(2020);
            setColor("");
            setMileage(0);
            setSelectedPerson(null);
            setSelectedBrand(null);
            setSelectedModel(null);
            setVehicleStatus("running"); // Valor por defecto
        }
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalType(null);
        setSelectedVehicle(null);
    };

    // Manejo del submit para crear y editar
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (modalType === "create") {
            if (!selectedPerson) {
                toast.error("Debes seleccionar un propietario para el vehículo");
                return;
            }
            if (!selectedBrand) {
                toast.error("Debes seleccionar una marca para el vehículo");
                return;
            }
            if (!selectedModel) {
                toast.error("Debes seleccionar un modelo para el vehículo");
                return;
            }
            try {
                console.log(licensePlate, year, color, vehicleStatus, selectedPerson.person_id, selectedBrand.vehicle_brand_id, selectedModel.vehicle_model_id, mileage);
                await api.post("/vehicles", {
                    license_plate: licensePlate,
                    year: year,
                    color: color,
                    vehicle_status: vehicleStatus, // Se envía el estado seleccionado ("running" o "not_running")
                    person_id: selectedPerson.person_id,
                    //vehicle_brand_id: selectedBrand.vehicle_brand_id,
                    vehicle_model_id: selectedModel.vehicle_model_id,
                    mileageHistory: [{ current_mileage: mileage }],
                });
                console.log(licensePlate, year, color, vehicleStatus, selectedPerson.person_id, selectedBrand.vehicle_brand_id, selectedModel.vehicle_model_id, mileage);
                toast.success("Vehículo creado correctamente");
                fetchVehicles();
                closeModal();
            } catch (error: any) {
                toast.error(
                    error.response?.data?.errors.map((e: any) => e.message).join(", ")
                );
            }
        } else if (modalType === "edit" && selectedVehicle) {
            try {
                await api.put(`/vehicles/${selectedVehicle.vehicle_id}`, {
                    license_plate: licensePlate,
                    year,
                    color,
                    mileageHistory: [{ current_mileage: mileage }],
                    // Aquí se podría agregar la lógica para actualizar el estado o el kilometraje si se requiere
                });
                toast.success("Vehículo actualizado correctamente");
                fetchVehicles();
                closeModal();
            } catch (error: any) {
                toast.error(
                    error.response?.data?.errors.map((e: any) => e.message).join(", ")
                );
            }
        }
    };

    // Función para confirmar eliminación
    const handleDeleteConfirm = async () => {
        if (selectedVehicle) {
            try {
                await api.delete(`/vehicles/${selectedVehicle.vehicle_id}`);
                toast.success("Vehículo eliminado correctamente");
                fetchVehicles();
                closeModal();
            } catch (error: any) {
                toast.error(
                    error.response?.data?.errors.map((e: any) => e.message).join(", ")
                );
            }
        }
    };

    // Alterna la visualización completa del historial de un vehículo
    const toggleExpanded = (vehicleId: number) => {
        setExpandedMileage((prev) => ({
            ...prev,
            [vehicleId]: !prev[vehicleId],
        }));
    };

    // Filtro de vehículos según el término de búsqueda
    const filteredVehicles = vehicles.filter((v) =>
        v.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.brand.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.model_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <ToastContainer />
            {/* Cabecera */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Car className="w-6 h-6" />
                    Vehículos Registrados
                </h1>
                <button
                    onClick={() => openModal("create")}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Vehículo
                </button>
            </div>

            {/* Buscador y Tabla */}
            <div className="bg-white/30 backdrop-blur-md rounded-lg shadow p-6">
                <div className="mb-4 relative">
                    <input
                        type="text"
                        placeholder="Buscar vehículo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg pl-10"
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
                {loading ? (
                    <div className="text-center py-4">Cargando vehículos...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Placa
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Marca / Modelo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Año
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Color
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Propietario
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Historial de Kilometraje
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredVehicles.map((vehicle) => {
                                    // Ordenar historial para obtener el registro más reciente
                                    const sortedMileage = [...vehicle.mileage_history].sort(
                                        (a, b) =>
                                            new Date(b.registration_date).getTime() -
                                            new Date(a.registration_date).getTime()
                                    );
                                    const latestMileage = sortedMileage[0];
                                    const additionalMileage = sortedMileage.slice(1);
                                    const isExpanded = expandedMileage[vehicle.vehicle_id];

                                    return (
                                        <tr key={vehicle.vehicle_id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {vehicle.license_plate}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {vehicle.model.brand.brand_name} / {vehicle.model.model_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {vehicle.year}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {vehicle.color}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {vehicle.owner.name} {vehicle.owner.first_surname}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {latestMileage ? (
                                                    <div>
                                                        <div>
                                                            {latestMileage.current_mileage} km - {latestMileage.registration_date}
                                                        </div>
                                                        {additionalMileage.length > 0 && (
                                                            <button
                                                                onClick={() => toggleExpanded(vehicle.vehicle_id)}
                                                                className="text-sm text-blue-600 hover:underline"
                                                            >
                                                                {isExpanded ? "Ocultar historial" : "Ver historial completo"}
                                                            </button>
                                                        )}
                                                        {isExpanded &&
                                                            additionalMileage.map((mh, idx) => (
                                                                <div key={idx} className="mt-1 text-sm">
                                                                    {mh.current_mileage} km - {mh.registration_date}
                                                                </div>
                                                            ))}
                                                    </div>
                                                ) : (
                                                    <span>Sin historial</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openModal("edit", vehicle)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => openModal("delete", vehicle)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Transition appear show={modalOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-10"
                    onClose={closeModal}
                >
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="w-96 bg-white shadow-lg rounded-lg p-6">
                            {modalType === "delete" ? (
                                <>
                                    <Dialog.Title className="text-xl font-bold mb-4">
                                        Confirmar eliminación
                                    </Dialog.Title>
                                    <p>
                                        ¿Está seguro que desea eliminar el vehículo{" "}
                                        {selectedVehicle?.license_plate}?
                                    </p>
                                    <div className="mt-6 flex justify-end gap-2">
                                        <button
                                            onClick={closeModal}
                                            className="px-4 py-2 border rounded"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleDeleteConfirm}
                                            className="px-4 py-2 bg-red-600 text-white rounded"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <Dialog.Title className="text-xl font-bold mb-4">
                                        {modalType === "create" ? "Nuevo Vehículo" : "Editar Vehículo"}
                                    </Dialog.Title>
                                    <div className="mb-4">
                                        <label className="block text-sm mb-1">Placa</label>
                                        <input
                                            type="text"
                                            value={licensePlate}
                                            onChange={(e) => setLicensePlate(e.target.value)}
                                            className="w-full border rounded p-2 bg-white text-gray-900"
                                            required
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm mb-1">Año</label>
                                        <input
                                            type="number"
                                            value={year}
                                            onChange={(e) => setYear(Number(e.target.value))}
                                            className="w-full border rounded p-2 bg-white text-gray-900"
                                            required
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm mb-1">Color</label>
                                        <input
                                            type="text"
                                            value={color}
                                            onChange={(e) => setColor(e.target.value)}
                                            pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$"
                                            className="w-full border rounded p-2 bg-white text-gray-900"
                                        />
                                    </div>
                                    <div className="mb-4">
                                                <label className="block text-sm mb-1">Kilometraje</label>
                                                <input
                                                    type="number"
                                                    value={mileage}
                                                    onChange={(e) => setMileage(Number(e.target.value))}
                                                    className="w-full border rounded p-2 bg-white text-gray-900"
                                                />
                                            </div>
                                    {modalType === "create" && (
                                        <>
                                            <div className="mb-4">
                                                <label className="block text-sm mb-1">Kilometraje</label>
                                                <input
                                                    type="number"
                                                    value={mileage}
                                                    onChange={(e) => setMileage(Number(e.target.value))}
                                                    className="w-full border rounded p-2 bg-white text-gray-900"
                                                    required
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-sm mb-1">Estado del vehículo</label>
                                                <Listbox value={vehicleStatus} onChange={setVehicleStatus}>
                                                    {({ open }) => (
                                                        <>
                                                            <Listbox.Button className="w-full border rounded p-2 bg-white text-gray-900 flex justify-between items-center">
                                                                <span>
                                                                    {vehicleStatusOptions.find(opt => opt.value === vehicleStatus)?.label || "Selecciona un estado"}
                                                                </span>
                                                                <ChevronsUpDown className="w-5 h-5" />
                                                            </Listbox.Button>
                                                            <Listbox.Options className="border rounded mt-1 max-h-60 overflow-auto bg-white">
                                                                {vehicleStatusOptions.map((option) => (
                                                                    <Listbox.Option
                                                                        key={option.value}
                                                                        value={option.value}
                                                                        className={({ active }) =>
                                                                            `cursor-pointer p-2 ${active ? "bg-blue-600 text-white" : "bg-white text-black"}`
                                                                        }
                                                                    >
                                                                        {({ selected }) => (
                                                                            <div className="flex justify-between items-center">
                                                                                <span>{option.label}</span>
                                                                                {selected && <Check className="w-4 h-4" />}
                                                                            </div>
                                                                        )}
                                                                    </Listbox.Option>
                                                                ))}
                                                            </Listbox.Options>
                                                        </>
                                                    )}
                                                </Listbox>
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-sm mb-1">Marca</label>
                                                <Listbox value={selectedBrand} onChange={setSelectedBrand}>
                                                    {({ open }) => (
                                                        <>
                                                            <Listbox.Button className="w-full border rounded p-2 bg-white text-gray-900 flex justify-between items-center">
                                                                <span>
                                                                    {selectedBrand ? selectedBrand.brand_name : "Selecciona una marca"}
                                                                </span>
                                                                <ChevronsUpDown className="w-5 h-5" />
                                                            </Listbox.Button>
                                                            <Listbox.Options className="border rounded mt-1 max-h-60 overflow-auto bg-white">
                                                                {brands.map((brand) => (
                                                                    <Listbox.Option
                                                                        key={brand.vehicle_brand_id}
                                                                        value={brand}
                                                                        className={({ active }) =>
                                                                            `cursor-pointer p-2 ${active ? "bg-blue-600 text-white" : "bg-white text-black"}`
                                                                        }
                                                                    >
                                                                        {({ selected }) => (
                                                                            <div className="flex justify-between items-center">
                                                                                <span>{brand.brand_name}</span>
                                                                                {selected && <Check className="w-4 h-4" />}
                                                                            </div>
                                                                        )}
                                                                    </Listbox.Option>
                                                                ))}
                                                            </Listbox.Options>
                                                        </>
                                                    )}
                                                </Listbox>
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-sm mb-1">Modelo</label>
                                                <Listbox value={selectedModel} onChange={setSelectedModel} disabled={!selectedBrand}>
                                                    {({ open }) => (
                                                        <>
                                                            <Listbox.Button
                                                                disabled={!selectedBrand}
                                                                className={`w-full border rounded p-2 bg-white text-gray-900 flex justify-between items-center ${!selectedBrand ? "opacity-50 cursor-not-allowed" : ""}`}
                                                            >
                                                                <span>
                                                                    {selectedModel
                                                                        ? selectedModel.model_name
                                                                        : !selectedBrand
                                                                            ? "Selecciona una marca primero"
                                                                            : "Selecciona un modelo"}
                                                                </span>
                                                                <ChevronsUpDown className="w-5 h-5" />
                                                            </Listbox.Button>
                                                            {selectedBrand && (
                                                                <Listbox.Options className="border rounded mt-1 max-h-60 overflow-auto bg-white">
                                                                    {models
                                                                        .filter(
                                                                            (model) =>
                                                                                model.vehicle_brand_id === selectedBrand.vehicle_brand_id
                                                                        )
                                                                        .map((model) => (
                                                                            <Listbox.Option
                                                                                key={model.vehicle_model_id}
                                                                                value={model}
                                                                                className={({ active }) =>
                                                                                    `cursor-pointer p-2 ${active ? "bg-blue-600 text-white" : "bg-white text-black"}`
                                                                                }
                                                                            >
                                                                                {({ selected }) => (
                                                                                    <div className="flex justify-between items-center">
                                                                                        <span>{model.model_name}</span>
                                                                                        {selected && <Check className="w-4 h-4" />}
                                                                                    </div>
                                                                                )}
                                                                            </Listbox.Option>
                                                                        ))}
                                                                </Listbox.Options>
                                                            )}
                                                        </>
                                                    )}
                                                </Listbox>
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-sm mb-1">Propietario</label>
                                                <OwnerListbox
                                                    persons={persons}
                                                    selectedPerson={selectedPerson}
                                                    setSelectedPerson={setSelectedPerson}
                                                />
                                            </div>
                                        </>
                                    )}
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-4 py-2 border rounded"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded shadow-md hover:bg-blue-700 transition"
                                        >
                                            {modalType === "create" ? "Crear" : "Modificar"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </Dialog.Panel>
                    </Transition.Child>
                </Dialog>
            </Transition>
        </div>
    );
};

export default VehiclesPage;
