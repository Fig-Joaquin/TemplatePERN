import { useEffect, useState } from "react";
import api from "../utils/axiosConfig";
import { Car, Edit, Trash2, Search, Plus } from "lucide-react";
import { showErrorToast, showSuccessToast } from "../utils/toastConfig";

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
        name: string;
        first_surname: string;
    };
}

type ModalType = "create" | "edit" | "delete";

const VehiclesPage = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<ModalType | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    // Estados para el formulario (simplificado)
    const [licensePlate, setLicensePlate] = useState("");
    const [year, setYear] = useState<number>(2020);
    const [color, setColor] = useState("");

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const response = await api.get("/vehicles");
            setVehicles(response.data);
            setLoading(false);
        } catch (error) {
            showErrorToast("Error al cargar los vehículos");
            setLoading(false);
        }
    };

    // Abrir modal según acción
    const openModal = (type: ModalType, vehicle: Vehicle | null = null) => {
        setModalType(type);
        setSelectedVehicle(vehicle);
        if (vehicle) {
            setLicensePlate(vehicle.license_plate);
            setYear(vehicle.year);
            setColor(vehicle.color);
        } else {
            setLicensePlate("");
            setYear(2020);
            setColor("");
        }
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalType(null);
        setSelectedVehicle(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (modalType === "create") {
            try {
                await api.post("/vehicles", {
                    license_plate: licensePlate,
                    year,
                    color,
                });
                showSuccessToast("Vehículo creado correctamente");
                fetchVehicles();
                closeModal();
            } catch (error) {
                showErrorToast("Error al crear el vehículo");
            }
        } else if (modalType === "edit" && selectedVehicle) {
            try {
                await api.put(`/vehicles/${selectedVehicle.vehicle_id}`, {
                    license_plate: licensePlate,
                    year,
                    color,
                });
                showSuccessToast("Vehículo actualizado correctamente");
                fetchVehicles();
                closeModal();
            } catch (error) {
                showErrorToast("Error al actualizar el vehículo");
            }
        }
    };

    const handleDeleteConfirm = async () => {
        if (selectedVehicle) {
            try {
                await api.delete(`/vehicles/${selectedVehicle.vehicle_id}`);
                showSuccessToast("Vehículo eliminado correctamente");
                fetchVehicles();
                closeModal();
            } catch (error) {
                showErrorToast("Error al eliminar el vehículo");
            }
        }
    };

    const filteredVehicles = vehicles.filter(
        (vehicle) =>
            vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vehicle.model.brand.brand_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            vehicle.model.model_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
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
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredVehicles.map((vehicle) => (
                                    <tr key={vehicle.vehicle_id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {vehicle.license_plate}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {vehicle.model.brand.brand_name} /{" "}
                                            {vehicle.model.model_name}
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalOpen && modalType && (
                <div className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-10">
                    <div className="bg-white shadow-lg rounded-lg w-96 p-6">
                        {modalType === "delete" ? (
                            <>
                                <h2 className="text-xl font-bold mb-4">
                                    Confirmar eliminación
                                </h2>
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
                                <h2 className="text-xl font-bold mb-4">
                                    {modalType === "create"
                                        ? "Nuevo Vehículo"
                                        : "Editar Vehículo"}
                                </h2>
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
                                        className="w-full border rounded p-2 bg-white text-gray-900"
                                    />
                                </div>
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehiclesPage;
