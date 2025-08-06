// CompanyForm.tsx
import type React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import RutInput from "./RutInput"

interface CompanyFormProps {
  formData: {
    rut: string
    name: string
    email: string
    phone: string
  }
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isCreating?: boolean
}

const CompanyForm: React.FC<CompanyFormProps> = ({ 
  formData, 
  handleInputChange, 
  handleSubmit, 
  onCancel,
  isCreating = false 
}) => {
  return (
    <div className="p-1">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3">
          <Label htmlFor="rut" className="text-sm font-medium text-gray-700">
            RUT <span className="text-red-500">*</span>
          </Label>
          <RutInput
            id="rut"
            name="rut"
            value={formData.rut}
            onChange={handleInputChange}
            className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          />
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Nombre de la Empresa <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Empresa S.A."
            className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
            placeholder="contacto@empresa.com"
            className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Teléfono (opcional)
          </Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
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
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="default"
            className="px-6 py-2 bg-primary hover:bg-primary/90 transition-all duration-200"
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Creando...
              </>
            ) : (
              "Crear Empresa"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CompanyForm
