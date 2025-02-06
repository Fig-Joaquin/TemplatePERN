import { Edit, Trash2 } from "lucide-react";
import VehicleList from "./vehicleList";
import { Vehicle } from "./vehicleList";



export interface Person {
    person_id: number;
    name: string;
    first_surname: string;
    second_surname?: string;
    email: string;
    number_phone: string;
    person_type: string;
    rut: string;
}

interface ClientListProps {
    persons: Person[];
    getVehiclesByPersonId: (personId: number) => Vehicle[];
    handleEdit: (person: Person) => void;
    handleDelete: (personId: number) => void;
}

const ClientList = ({ persons, getVehiclesByPersonId, handleEdit, handleDelete }: ClientListProps) => {
    return (
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
                    {persons.map((person) => (
                        <tr key={person.person_id}>
                            <td className="px-6 py-4 whitespace-nowrap">{person.rut}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{person.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{person.first_surname}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{person.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <VehicleList vehicles={getVehiclesByPersonId(person.person_id)} />
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
    );
};

export default ClientList;