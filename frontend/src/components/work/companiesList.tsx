// src/components/companyList.tsx
import type { Company, Brand } from "../../types/interfaces";
import { Button } from "@/components/ui/button";
import VehicleList from "../vehicleList";
import RutFormatter from "../RutFormatter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";

interface CompanyListProps {
  companies: Company[];
  handleEdit: (company: Company) => void;
  handleDelete: (companyId: number) => void;
  brands?: Brand[];
}

const CompanyList: React.FC<CompanyListProps> = ({ companies, handleEdit, handleDelete, brands }) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>RUT</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Vehículos</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.company_id}>
              <TableCell>
                <RutFormatter rut={company.rut} />
              </TableCell>
              <TableCell>{company.name}</TableCell>
              <TableCell>{company.email ?? "No hay información"}</TableCell>
              <TableCell>+{company.phone ?? "No hay información"}</TableCell>
              <TableCell>
                {company.vehicles && company.vehicles.length > 0 ? (
                  <VehicleList
                    vehicles={company.vehicles}
                    brands={brands}
                    companyId={company.company_id}
                  />
                ) : (
                  <VehicleList
                    vehicles={[]}
                    brands={brands}
                    companyId={company.company_id}
                  />
                )}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(company)}>
                    <Edit className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Editar</span>
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(company.company_id)}>
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Eliminar</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CompanyList;
