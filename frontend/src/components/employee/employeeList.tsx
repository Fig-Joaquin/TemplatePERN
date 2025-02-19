// EmployeeList.tsx
import React, { useEffect, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { Person, Vehicle } from "../../types/interfaces";
import { Button } from "@/components/ui/button";
import VehicleList from "../vehicleList";
import RutFormatter from "../RutFormatter";

interface EmployeeListProps {
  persons: Person[];
  getVehiclesByPersonId: (personId: number) => Promise<Vehicle[]>;
  handleEdit: (person: Person) => void;
  handleDelete: (personId: number) => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ persons, getVehiclesByPersonId, handleEdit, handleDelete }) => {
  const [vehicles, setVehicles] = useState<{ [key: number]: Vehicle[] }>({});

  useEffect(() => {
    const fetchAllVehicles = async () => {
      const vehiclesData: { [key: number]: Vehicle[] } = {};
      for (const person of persons) {
        vehiclesData[person.person_id] = await getVehiclesByPersonId(person.person_id);
      }
      setVehicles(vehiclesData);
    };

    fetchAllVehicles();
  }, [persons, getVehiclesByPersonId]);

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
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {persons.map((person) => (
            <tr key={person.person_id}>
              <td className="px-6 py-4 whitespace-nowrap"><RutFormatter rut={person.rut} /></td>
              <td className="px-6 py-4 whitespace-nowrap">{person.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{person.first_surname}</td>
              <td className="px-6 py-4 whitespace-nowrap">{person.email}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex gap-2">
                  <Button variant="ghost" className="text-blue-600 hover:text-blue-800" onClick={() => handleEdit(person)}>
                    <Edit className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" className="text-red-600 hover:text-red-800" onClick={() => handleDelete(person.person_id)}>
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeList;
