// src/components/companyList.tsx

import type { Company } from "../../types/interfaces";
import { Button } from "@/components/ui/button";

interface CompanyListProps {
  companies: Company[];
  handleEdit: (company: Company) => void;
  handleDelete: (companyId: number) => void;
}

const CompanyList: React.FC<CompanyListProps> = ({ companies, handleEdit, handleDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              RUT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Teléfono
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {companies.map((company) => (
            <tr key={company.company_id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {company.rut}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {company.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {company.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {company.phone || "Sin teléfono"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                <Button variant="outline" onClick={() => handleEdit(company)}>
                  Editar
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(company.company_id)}>
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyList;
