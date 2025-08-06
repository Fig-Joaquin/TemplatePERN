// ClientForm.tsx
import type React from "react"
import type { ClientFormProps } from "../types/interfaces"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import RutInput from "./RutInput"

const ClientForm: React.FC<ClientFormProps> = ({ formData, handleInputChange, handleSubmit, onCancel }) => {
  return (
    <div className="p-1">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3">
          <Label htmlFor="rut" className="text-sm font-medium text-gray-700">
            RUT (opcional)
          </Label>
          <RutInput
            id="rut"
            name="rut"
            value={formData.rut ?? ""}
            onChange={handleInputChange}
            className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-3">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Alejandro"
              className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$"
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="first_surname" className="text-sm font-medium text-gray-700">
              Primer Apellido <span className="text-red-500">*</span>
            </Label>
            <Input
              id="first_surname"
              name="first_surname"
              value={formData.first_surname}
              onChange={handleInputChange}
              required
              placeholder="Pérez"
              className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$"
            />
          </div>
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="second_surname" className="text-sm font-medium text-gray-700">
            Segundo Apellido (opcional)
          </Label>
          <Input
            id="second_surname"
            name="second_surname"
            value={formData.second_surname}
            onChange={handleInputChange}
            placeholder="González"
            className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$"
          />
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email (opcional)
          </Label>
          <Input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="ejemplo@correo.com"
            className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="number_phone" className="text-sm font-medium text-gray-700">
            Teléfono <span className="text-red-500">*</span>
          </Label>
          <Input
            id="number_phone"
            name="number_phone"
            value={formData.number_phone}
            onChange={handleInputChange}
            required
            placeholder="56912345678"
            className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="px-6 py-2 transition-all duration-200 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="default"
            className="px-6 py-2 bg-primary hover:bg-primary/90 transition-all duration-200"
          >
            {formData.person_type === "cliente" ? "Crear Cliente" : "Actualizar"}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ClientForm
