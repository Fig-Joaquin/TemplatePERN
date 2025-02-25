// ClientForm.tsx
import type React from "react"
import type { ClientFormProps } from "../types/interfaces"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import RutInput from "./RutInput"

const ClientForm: React.FC<ClientFormProps> = ({ formData, handleInputChange, handleSubmit, onCancel }) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rut">RUT</Label>
        <RutInput
          id="rut"
          name="rut"
          value={formData.rut}
          onChange={handleInputChange}
          required
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          placeholder="Alejandro"
          className="w-full"
          pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="first_surname">Primer Apellido</Label>
        <Input
          id="first_surname"
          name="first_surname"
          value={formData.first_surname}
          onChange={handleInputChange}
          required
          placeholder="Peréz"
          className="w-full"
          pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="second_surname">Segundo Apellido (opcional)</Label>
        <Input
          id="second_surname"
          name="second_surname"
          value={formData.second_surname}
          onChange={handleInputChange}
          placeholder="González"
          className="w-full"
          pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          placeholder="ejemplo@correo.com"
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="number_phone">Teléfono</Label>
        <Input
          id="number_phone"
          name="number_phone"
          value={formData.number_phone}
          onChange={handleInputChange}
          required
          placeholder="56912345678"
          className="w-full"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="default">
          {formData.person_type === "cliente" ? "Añadir" : "Actualizar"}
        </Button>
      </div>
    </form>
  )
}

export default ClientForm
