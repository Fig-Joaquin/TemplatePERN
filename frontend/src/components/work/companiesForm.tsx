// src/components/companyForm.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CompanyFormProps {
  formData: {
    rut: string;
    name: string;
    email: string;
    phone: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const CompanyForm: React.FC<CompanyFormProps> = ({ formData, handleInputChange, handleSubmit, onCancel }) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">RUT</label>
        <Input
          type="text"
          name="rut"
          value={formData.rut}
          onChange={handleInputChange}
          placeholder="Ingrese el RUT"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
        <Input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Ingrese el nombre"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <Input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Ingrese el email"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Teléfono</label>
        <Input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="Ingrese el teléfono"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
};

export default CompanyForm;
