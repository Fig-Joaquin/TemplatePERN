import { useEffect, useState, Fragment } from "react";
import api from "../utils/axiosConfig";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Edit, Trash2, Plus, Search } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";

interface Vehicle {
    vehicle_id: number;
    license_plate: string;
    model: {
        model_name: string;
        brand: {
            brand_name: string;
        };
    };
    year: number;
    owner: {
        person_id?: number;
        name: string;
        first_surname: string;
    };
}

interface Person {
    person_id: number;
    name: string;
    first_surname: string;
    second_surname?: string;
    email: string;
    number_phone: string;
    person_type: string;
    rut: string;
}

const ClientPage = () => {
    const [persons, setPersons] = useState<Person[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [formData, setFormData] = useState({
        rut: "",
        name: "",
        first_surname: "",
        second_surname: "",
        email: "",
        number_phone: "",
        person_type: "cliente",
    });

    useEffect(() => {
        const fetchPersons = async () => {
            try {
                const { data } = await api.get<Person[]>("/persons");
                const clients = data.filter(person => person.person_type === "cliente");
                setPersons(clients);
            } catch {
                toast.error("Error al cargar las personas");
            } finally {
                setLoading(false);
            }
        };

        const fetchVehicles = async () => {
            try {
                const { data } = await api.get<Vehicle[]>("/vehicles");
                setVehicles(data);
            } catch {
                toast.error("Error al cargar los vehículos");
            }
        };

        fetchPersons();
        fetchVehicles();
    }, []);

    const getVehiclesByPersonId = (personId: number) => {
        return vehicles.filter(vehicle => vehicle.owner.person_id === personId);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            console.log(formData);
            await api.post("/persons/", formData);
            toast.success("Cliente creado exitosamente");
            setAddModalOpen(false);
            setFormData({
                rut: "",
                name: "",
                first_surname: "",
                second_surname: "",
                email: "",
                number_phone: "",
                person_type: "cliente",
            });
            const { data } = await api.get<Person[]>("/persons");
            const clients = data.filter(person => person.person_type === "cliente");
            setPersons(clients);
        } catch (error: any) {
            console.log(error.response?.data?.message);
            toast.error(
                error.response?.data?.message  || error.response?.data?.errors.map((e: any) => e.message).join(", ")
            );
        }
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedPerson) {
                await api.put(`/persons/${selectedPerson.person_id}`, formData);
                toast.success("Cliente actualizado exitosamente");
                setEditModalOpen(false);
                setSelectedPerson(null);
                setFormData({
                    rut: "",
                    name: "",
                    first_surname: "",
                    second_surname: "",
                    email: "",
                    number_phone: "",
                    person_type: "cliente",
                });
                const { data } = await api.get<Person[]>("/persons");
                const clients = data.filter(person => person.person_type === "cliente");
                setPersons(clients);
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.errors.map((e: any) => e.message).join(", ")
            );
        }
    };

    const handleEdit = (person: Person) => {
        setSelectedPerson(person);
        setFormData({
            rut: person.rut,
            name: person.name,
            first_surname: person.first_surname,
            second_surname: person.second_surname || "",
            email: person.email,
            number_phone: person.number_phone,
            person_type: person.person_type,
        });
        setEditModalOpen(true);
    };

    const handleDelete = async (personId: number) => {
        try {
            await api.delete(`/persons/${personId}`);
            toast.success("Cliente eliminado exitosamente");
            setPersons(persons.filter(person => person.person_id !== personId));
        } catch {
            toast.error("Error al eliminar el cliente");
        }
    };

    const filteredPersons = persons.filter(person =>
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.rut.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <ToastContainer />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Lista de Clientes</h1>
                <button
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    onClick={() => setAddModalOpen(true)}
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Cliente
                </button>
            </div>

            <div className="mb-4 relative">
                <input
                    type="text"
                    placeholder="Buscar por nombre o RUT"
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full px-4 py-2 border rounded-lg pl-10"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>

            <div className="bg-white/30 backdrop-blur-md rounded-lg shadow p-6">
                {loading ? (
                    <div className="text-center py-4">Cargando clientes...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        RUT
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nombre
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Apellido
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vehículos
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredPersons.map((person) => (
                                    <tr key={person.person_id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{person.rut}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{person.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{person.first_surname}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{person.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getVehiclesByPersonId(person.person_id).map(vehicle => (
                                                <div key={vehicle.vehicle_id}>
                                                    {vehicle.license_plate} - {vehicle.model.brand.brand_name} {vehicle.model.model_name} ({vehicle.year})
                                                </div>
                                            ))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex gap-2">
                                                <button
                                                    className="text-blue-600 hover:text-blue-800"
                                                    onClick={() => handleEdit(person)}
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button
                                                    className="text-red-600 hover:text-red-800"
                                                    onClick={() => handleDelete(person.person_id)}
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

            <Transition appear show={addModalOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-10"
                    onClose={() => setAddModalOpen(false)}
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
                            <Dialog.Title className="text-xl font-bold mb-4">
                                Nuevo Cliente
                            </Dialog.Title>
                            <form onSubmit={handleCreateSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm mb-1">RUT</label>
                                    <input
                                        type="text"
                                        name="rut"
                                        onChange={handleInputChange}
                                        className="w-full border rounded p-2 bg-white text-gray-900"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        name="name"
                                        onChange={handleInputChange}
                                        className="w-full border rounded p-2 bg-white text-gray-900"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm mb-1">Primer Apellido</label>
                                    <input
                                        type="text"
                                        name="first_surname"
                                        onChange={handleInputChange}
                                        className="w-full border rounded p-2 bg-white text-gray-900"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm mb-1">Segundo Apellido</label>
                                    <input
                                        type="text"
                                        name="second_surname"
                                        onChange={handleInputChange}
                                        className="w-full border rounded p-2 bg-white text-gray-900"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        onChange={handleInputChange}
                                        className="w-full border rounded p-2 bg-white text-gray-900"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm mb-1">Teléfono</label>
                                    <input
                                        type="text"
                                        name="number_phone"
                                        onChange={handleInputChange}
                                        className="w-full border rounded p-2 bg-white text-gray-900"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAddModalOpen(false)}
                                        className="px-4 py-2 border rounded"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded shadow-md hover:bg-blue-700 transition"
                                    >
                                        Añadir
                                    </button>
                                </div>
                            </form>
                        </Dialog.Panel>
                    </Transition.Child>
                </Dialog>
            </Transition>

            <Transition appear show={editModalOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-10"
                    onClose={() => setEditModalOpen(false)}
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
                            <Dialog.Title className="text-xl font-bold mb-4">
                                Editar Cliente
                            </Dialog.Title>
                            <form onSubmit={handleUpdateSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm mb-1">RUT</label>
                                    <input
                                        type="text"
                                        name="rut"
                                        value={formData.rut}
                                        onChange={handleInputChange}
                                        className="w-full border rounded p-2 bg-white text-gray-900"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full border rounded p-2 bg-white text-gray-900"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm mb-1">Primer Apellido</label>
                                    <input
                                        type="text"
                                        name="first_surname"
                                        value={formData.first_surname}
                                        onChange={handleInputChange}
                                        className="w-full border rounded p-2 bg-white text-gray-900"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm mb-1">Segundo Apellido</label>
                                    <input
                                        type="text"
                                        name="second_surname"
                                        value={formData.second_surname}
                                        onChange={handleInputChange}
                                        className="w-full border rounded p-2 bg-white text-gray-900"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full border rounded p-2 bg-white text-gray-900"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm mb-1">Teléfono</label>
                                    <input
                                        type="text"
                                        name="number_phone"
                                        value={formData.number_phone}
                                        onChange={handleInputChange}
                                        className="w-full border rounded p-2 bg-white text-gray-900"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditModalOpen(false);
                                            setSelectedPerson(null);
                                        }}
                                        className="px-4 py-2 border rounded"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded shadow-md hover:bg-blue-700 transition"
                                    >
                                        Actualizar
                                    </button>
                                </div>
                            </form>
                        </Dialog.Panel>
                    </Transition.Child>
                </Dialog>
            </Transition>
        </div>
    );
};

export default ClientPage;
