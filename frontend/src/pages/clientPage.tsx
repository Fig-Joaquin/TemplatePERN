import { useEffect, useState, Fragment } from "react";
import api from "../utils/axiosConfig";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Plus } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import ClientList from "../components/clientList";
import ClientForm from "../components/clientForm";
import SearchBar from "../components/searchBar";
import { Person } from "../components/clientList";
import { Vehicle } from "../components/vehicleList";

const ClientPage = () => {
    const [persons, setPersons] = useState<Person[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<number | null>(null);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [createFormData, setCreateFormData] = useState({
        rut: "",
        name: "",
        first_surname: "",
        second_surname: "",
        email: "",
        number_phone: "",
        person_type: "cliente",
    });
    const [editFormData, setEditFormData] = useState({
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

    const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCreateFormData({ ...createFormData, [name]: value });
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditFormData({ ...editFormData, [name]: value });
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/persons/", createFormData);
            toast.success("Cliente creado exitosamente");
            setAddModalOpen(false);
            setCreateFormData({
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
            toast.error(
                error.response?.data?.message || error.response?.data?.errors.map((e: any) => e.message).join(", ")
            );
        }
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedPerson) {
                await api.put(`/persons/${selectedPerson.person_id}`, editFormData);
                toast.success("Cliente actualizado exitosamente");
                setEditModalOpen(false);
                setSelectedPerson(null);
                setEditFormData({
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
        setEditFormData({
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

    const handleDelete = (personId: number) => {
        setClientToDelete(personId);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (clientToDelete) {
            try {
                await api.delete(`/persons/${clientToDelete}`);
                toast.success("Cliente eliminado exitosamente");
                setPersons(persons.filter(person => person.person_id !== clientToDelete));
            } catch (error: any) {
                toast.error(
                    error.response?.data?.message || error.response?.data?.errors.map((e: any) => e.message).join(", ")
                );
            } finally {
                setDeleteModalOpen(false);
                setClientToDelete(null);
            }
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

            <SearchBar searchTerm={searchTerm} handleSearch={handleSearch} />

            <div className="bg-white/30 backdrop-blur-md rounded-lg shadow p-6">
                {loading ? (
                    <div className="text-center py-4">Cargando clientes...</div>
                ) : (
                    <ClientList
                        persons={filteredPersons}
                        getVehiclesByPersonId={getVehiclesByPersonId}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                    />
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
                            <ClientForm
                                formData={createFormData}
                                handleInputChange={handleCreateInputChange}
                                handleSubmit={handleCreateSubmit}
                                onCancel={() => setAddModalOpen(false)}
                            />
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
                            <ClientForm
                                formData={editFormData}
                                handleInputChange={handleEditInputChange}
                                handleSubmit={handleUpdateSubmit}
                                onCancel={() => {
                                    setEditModalOpen(false);
                                    setSelectedPerson(null);
                                }}
                            />
                        </Dialog.Panel>
                    </Transition.Child>
                </Dialog>
            </Transition>

            <Transition appear show={deleteModalOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-10"
                    onClose={() => setDeleteModalOpen(false)}
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
                                Confirmar Eliminación
                            </Dialog.Title>
                            <p>¿Estás seguro de eliminar este cliente?</p>
                            <div className="flex justify-end mt-4">
                                <button
                                    className="bg-gray-300 text-black px-4 py-2 rounded mr-2"
                                    onClick={() => setDeleteModalOpen(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="bg-red-600 text-white px-4 py-2 rounded"
                                    onClick={() => handleConfirmDelete()}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </Dialog>
            </Transition>
        </div>
    );
};

export default ClientPage;