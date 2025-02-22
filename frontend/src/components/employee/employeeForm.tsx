// EmployeeForm.tsx
import type React from "react"
import { Input } from "@/components/ui/input" // Otros inputs los mantienes si lo deseas
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { EmployeeFormProps } from "../../types/interfaces"
import RutInput from "../RutInput"

const EmployeeForm: React.FC<EmployeeFormProps> = ({ formData, handleInputChange, handleSubmit, onCancel }) => {
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <Label htmlFor="rut" className="block text-sm mb-1">
          RUT
        </Label>
        <RutInput
          id="rut"
          name="rut"
          value={formData.rut}
          onChange={handleInputChange}
          required
          className="w-full border rounded p-2 bg-white text-gray-900"
        />
      </div>
      <div className="mb-4">
        <Label htmlFor="name" className="block text-sm mb-1">
          Nombre
        </Label>
        <Input
          id="name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="w-full border rounded p-2 bg-white text-gray-900"
          pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$"
        />
      </div>
      <div className="mb-4">
        <Label htmlFor="first_surname" className="block text-sm mb-1">
          Apellido
        </Label>
        <Input
          id="first_surname"
          type="text"
          name="first_surname"
          value={formData.first_surname}
          onChange={handleInputChange}
          required
          className="w-full border rounded p-2 bg-white text-gray-900"
          pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$"
        />
      </div>
      <div className="mb-4">
        <Label htmlFor="second_surname" className="block text-sm mb-1">
          Segundo Apellido
        </Label>
        <Input
          id="second_surname"
          type="text"
          name="second_surname"
          value={formData.second_surname}
          onChange={handleInputChange}
          className="w-full border rounded p-2 bg-white text-gray-900"
          pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$"
        />
      </div>
      <div className="mb-4">
        <Label htmlFor="email" className="block text-sm mb-1">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="w-full border rounded p-2 bg-white text-gray-900"
        />
      </div>
      <div className="mb-4">
        <Label htmlFor="number_phone" className="block text-sm mb-1">
          Número de teléfono
        </Label>
        <Input
          id="number_phone"
          type="text"
          name="number_phone"
          value={formData.number_phone}
          onChange={handleInputChange}
          required
          className="w-full border rounded p-2 bg-white text-gray-900"
        />
      </div>
      {/* Campo oculto para mantener el rol */}
      <input type="hidden" name="person_type" value="employee" />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="px-4 py-2 border rounded">
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="default"
          className="px-4 py-2 bg-blue-600 text-white rounded shadow-md hover:bg-blue-700 transition"
        >
          {formData.person_type === "employee" ? "Actualizar" : "Registrar"}
        </Button>
      </div>
    </form>
  )
}

export default EmployeeForm

