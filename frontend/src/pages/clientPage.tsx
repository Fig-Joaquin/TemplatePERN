import { useEffect, useState } from "react";
import api from "../utils/axiosConfig";
import { toast, ToastContainer } from "react-toastify";
import { Plus } from "lucide-react";
import ClientList from "../components/clientList";
import ClientForm from "../components/clientForm";
import SearchBar from "../components/searchBar";
import { Person, Vehicle } from "../types/interfaces";
import { createPerson, updatePerson, fetchPersonsClient } from "../services/personService";
import { fetchVehicles, fetchVehiclesByPersonId } from "../services/vehicleService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ClientPage = () => {
    const [persons, setPersons] = useState<Person[]>([]);
    const [, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<number | null>(null);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const initialFormData = {
        rut: "",
        name: "",
        first_surname: "",
        second_surname: "",
        email: "",
        number_phone: "",
        person_type: "cliente",
    };
    const [createFormData, setCreateFormData] = useState(initialFormData);
    const [editFormData, setEditFormData] = useState(initialFormData);

    useEffect(() => {
        const fetchPersons = async () => {
            try {
                const clients = await fetchPersonsClient();
                setPersons(clients);
            } catch {
                toast.error("Error al cargar las personas");
            } finally {
                setLoading(false);
            }
        };

        const fetchVehiclesData = async () => {
            try {
                const vehicles = await fetchVehicles();
                setVehicles(vehicles);
            } catch {
                toast.error("Error al cargar los vehículos");
            }
        };

        fetchPersons();
        fetchVehiclesData();
    }, []);

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
            await createPerson(createFormData);
            toast.success("Cliente creado exitosamente");
            setAddModalOpen(false);
            setCreateFormData(initialFormData);
            const clients = await fetchPersonsClient();
            setPersons(clients);
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                error.response?.data?.errors?.map((e: any) => e.message).join(", ") ||
                "Error al crear el cliente"
            );
        }
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedPerson) {
                await updatePerson(selectedPerson.person_id, editFormData);
                toast.success("Cliente actualizado exitosamente");
                setEditModalOpen(false);
                setSelectedPerson(null);
                setEditFormData(initialFormData);
                const clients = await fetchPersonsClient();
                setPersons(clients);
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                error.response?.data?.errors?.map((e: any) => e.message).join(", ") ||
                "Error al actualizar el cliente"
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
        if (clientToDelete !== null) {
            try {
                await api.delete(`/persons/${clientToDelete}`);
                toast.success("Cliente eliminado exitosamente");
                setPersons(persons.filter(person => person.person_id !== clientToDelete));
            } catch (error: any) {
                toast.error(
                    error.response?.data?.message ||
                    error.response?.data?.errors?.map((e: any) => e.message).join(", ") ||
                    "Error al eliminar el cliente"
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
                <Button onClick={() => setAddModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Cliente
                </Button>
            </div>

            <SearchBar searchTerm={searchTerm} handleSearch={handleSearch} />

            <div className="bg-white/30 backdrop-blur-md rounded-lg shadow p-6">
                {loading ? (
                    <div className="text-center py-4">Cargando clientes...</div>
                ) : (
                    <ClientList
                        persons={filteredPersons}
                        getVehiclesByPersonId={fetchVehiclesByPersonId}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                    />
                )}
            </div>

            {/* Add Modal */}
            <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                {addModalOpen && <div className="fixed inset-0 bg-transparent backdrop-blur-sm" />}
                <DialogContent className="w-96 bg-white shadow-lg rounded-lg p-6">
                    <DialogHeader>
                        <DialogTitle>Nuevo Cliente</DialogTitle>
                    </DialogHeader>
                    <ClientForm
                        formData={createFormData}
                        handleInputChange={handleCreateInputChange}
                        handleSubmit={handleCreateSubmit}
                        onCancel={() => setAddModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={editModalOpen} onOpenChange={() => { setEditModalOpen(false); setSelectedPerson(null); }}>
                {editModalOpen && <div className="fixed inset-0 bg-transparent backdrop-blur-sm" />}
                <DialogContent className="w-96 bg-white shadow-lg rounded-lg p-6">
                    <DialogHeader>
                        <DialogTitle>Editar Cliente</DialogTitle>
                    </DialogHeader>
                    <ClientForm
                        formData={editFormData}
                        handleInputChange={handleEditInputChange}
                        handleSubmit={handleUpdateSubmit}
                        onCancel={() => {
                            setEditModalOpen(false);
                            setSelectedPerson(null);
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Modal */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                {deleteModalOpen && <div className="fixed inset-0 bg-transparent backdrop-blur-sm" />}
                <DialogContent className="w-96 bg-white shadow-lg rounded-lg p-6">
                    <DialogHeader>
                        <DialogTitle>Confirmar Eliminación</DialogTitle>
                    </DialogHeader>
                    <p>¿Estás seguro de eliminar este cliente?</p>
                    <div className="flex justify-end mt-4 gap-2">
                        <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>Eliminar</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ClientPage;
