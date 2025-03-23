// EmployeeForm.tsx
import type React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { EmployeeFormProps } from "../../types/interfaces"
import RutInput from "../RutInput"

const EmployeeForm: React.FC<EmployeeFormProps> = ({ formData, handleInputChange, handleSubmit, onCancel }) => {
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <Label htmlFor="rut" className="block text-sm mb-1">
          RUT (opcional)
        </Label>
        <RutInput
          id="rut"
          name="rut"
          value={formData.rut}
          onChange={handleInputChange}
          className="w-full border rounded p-2 bg-white text-gray-900"
        />
      </div>
      <div className="mb-4">
        <Label htmlFor="name" className="block text-sm mb-1">
          Nombre *
        </Label>
        <Input
          id="name"
          type="text"
          name="name"
          placeholder="Juan"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="w-full border rounded p-2 bg-white text-gray-900"
          pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$"
        />
      </div>
      <div className="mb-4">
        <Label htmlFor="first_surname" className="block text-sm mb-1">
          Apellido *
        </Label>
        <Input
          id="first_surname"
          type="text"
          name="first_surname"
          placeholder="Pérez"
          value={formData.first_surname}
          onChange={handleInputChange}
          required
          className="w-full border rounded p-2 bg-white text-gray-900"
          pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$"
        />
      </div>
      <div className="mb-4">
        <Label htmlFor="second_surname" className="block text-sm mb-1">
          Segundo Apellido (opcional)
        </Label>
        <Input
          id="second_surname"
          type="text"
          name="second_surname"
          placeholder="González"
          value={formData.second_surname}
          onChange={handleInputChange}
          className="w-full border rounded p-2 bg-white text-gray-900"
          pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$"
        />
      </div>
      <div className="mb-4">
        <Label htmlFor="email" className="block text-sm mb-1">
          Email (opcional)
        </Label>
        <Input
          id="email"
          type="email"
          name="email"
          placeholder="usuario@gmail.com"
          value={formData.email}
          onChange={handleInputChange}
          className="w-full border rounded p-2 bg-white text-gray-900"
        />
      </div>
      <div className="mb-4">
        <Label htmlFor="number_phone" className="block text-sm mb-1">
          Número de teléfono *
        </Label>
        <Input
          id="number_phone"
          type="text"
          name="number_phone"
          value={formData.number_phone}
          onChange={handleInputChange}
          required
          placeholder="56912345678"
          className="w-full border rounded p-2 bg-white text-gray-900"
        />
      </div>
      {/* Campo oculto para mantener el rol */}
      <input type="hidden" name="person_type" value="employee" />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="default">
          {formData.person_type === "employee" ? "Actualizar" : "Registrar"}
        </Button>
      </div>
    </form>
  )
}

export default EmployeeForm
