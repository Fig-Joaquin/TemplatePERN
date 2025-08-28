import type React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface SupplierFormProps {
  formData: {
    name: string
    address?: string
    city?: string
    description?: string
    phone: string
  }
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isCreating?: boolean
}

const SupplierForm: React.FC<SupplierFormProps> = ({
  formData,
  handleInputChange,
  handleSubmit,
  onCancel,
  isCreating
}) => {
  return (
    <div className="p-1">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Nombre del Proveedor <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Empresa ABC S.A."
            className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="address" className="text-sm font-medium text-gray-700">
            Dirección (opcional)
          </Label>
          <Input
            id="address"
            name="address"
            value={formData.address || ""}
            onChange={handleInputChange}
            placeholder="Av. Principal 123"
            className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="city" className="text-sm font-medium text-gray-700">
            Ciudad (opcional)
          </Label>
          <Input
            id="city"
            name="city"
            value={formData.city || ""}
            onChange={handleInputChange}
            placeholder="Santiago"
            className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Teléfono <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            placeholder="56912345678"
            className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
            Descripción (opcional)
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleInputChange}
            placeholder="Descripción de los productos o servicios que provee"
            className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            rows={3}
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
            {isCreating ? "Crear Proveedor" : "Actualizar"}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default SupplierForm
