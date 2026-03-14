"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { NumberInput } from "@/components/numberInput"
import { formatPriceCLP } from "@/utils/formatPriceCLP"
import { Wrench, Search, Plus, Check, X, ShoppingCart, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Service, SelectedService } from "@/types/service"

interface ServiceSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  services: Service[]
  selectedServices: SelectedService[]
  onConfirm: (selected: SelectedService[]) => void
  onCancel: () => void
  title?: string
  description?: string
}

export function ServiceSelectorModal({
  open,
  onOpenChange,
  services,
  selectedServices: initialSelected,
  onConfirm,
  onCancel,
  title = "Seleccionar Servicios",
  description = "Selecciona los servicios a agregar y configura las cantidades",
}: ServiceSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"available" | "selected">("available")
  const [localSelected, setLocalSelected] = useState<SelectedService[]>(initialSelected)

  // Reset local state when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setLocalSelected(initialSelected)
      setSearchQuery("")
      setActiveTab("available")
    }
    onOpenChange(isOpen)
  }

  const filteredServices = useMemo(() => {
    const activeServices = services.filter((s) => s.is_active)
    if (!searchQuery.trim()) return activeServices
    const query = searchQuery.toLowerCase()
    return activeServices.filter(
      (s) =>
        s.service_name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query)
    )
  }, [services, searchQuery])

  const isSelected = (serviceId: number) =>
    localSelected.some((s) => s.serviceId === serviceId)

  const handleAddService = (service: Service) => {
    if (isSelected(service.service_id)) return
    setLocalSelected((prev) => [
      ...prev,
      {
        serviceId: service.service_id,
        serviceName: service.service_name,
        cantidad: 1,
        precio_unitario: Number(service.base_price),
        subtotal: Number(service.base_price),
      },
    ])
  }

  const handleRemoveService = (serviceId: number) => {
    setLocalSelected((prev) => prev.filter((s) => s.serviceId !== serviceId))
  }

  const handleCantidadChange = (serviceId: number, cantidad: number) => {
    const validCantidad = Math.max(1, cantidad)
    setLocalSelected((prev) =>
      prev.map((s) =>
        s.serviceId === serviceId
          ? { ...s, cantidad: validCantidad, subtotal: validCantidad * s.precio_unitario }
          : s
      )
    )
  }

  const handlePrecioChange = (serviceId: number, precio: number) => {
    const validPrecio = Math.max(0, precio)
    setLocalSelected((prev) =>
      prev.map((s) =>
        s.serviceId === serviceId
          ? { ...s, precio_unitario: validPrecio, subtotal: s.cantidad * validPrecio }
          : s
      )
    )
  }

  const totalServicios = useMemo(
    () => localSelected.reduce((acc, s) => acc + s.subtotal, 0),
    [localSelected]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Wrench className="w-5 h-5 text-primary" />
              </div>
              {title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col lg:flex-row h-[65vh]">
          {/* Panel izquierdo — catálogo */}
          <div className="flex-1 flex flex-col border-r">
            {/* Búsqueda y tabs */}
            <div className="p-4 space-y-3 border-b bg-muted/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre o descripción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant={activeTab === "available" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("available")}
                  className="flex-1"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Disponibles ({filteredServices.length})
                </Button>
                <Button
                  variant={activeTab === "selected" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("selected")}
                  className="flex-1"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Seleccionados ({localSelected.length})
                </Button>
              </div>
            </div>

            {/* Lista */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {activeTab === "available" ? (
                  <>
                    {filteredServices.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No se encontraron servicios</p>
                        <p className="text-sm">Intenta con otro término de búsqueda</p>
                      </div>
                    ) : (
                      filteredServices.map((service) => {
                        const selected = isSelected(service.service_id)
                        return (
                          <div
                            key={service.service_id}
                            className={cn(
                              "group relative p-4 rounded-xl border transition-all duration-200",
                              selected
                                ? "bg-primary/5 border-primary shadow-sm cursor-pointer"
                                : "bg-card hover:bg-accent/50 hover:border-primary/30 hover:shadow-sm cursor-pointer"
                            )}
                            onClick={() => {
                              if (!selected) handleAddService(service)
                            }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h4 className="font-semibold truncate text-foreground">
                                    {service.service_name}
                                  </h4>
                                  {selected && (
                                    <Badge className="bg-primary/10 text-primary border-0">
                                      <Check className="w-3 h-3 mr-1" />
                                      Seleccionado
                                    </Badge>
                                  )}
                                </div>
                                {service.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                    {service.description}
                                  </p>
                                )}
                                <Badge variant="secondary" className="font-mono">
                                  {formatPriceCLP(Number(service.base_price))}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-2">
                                {selected ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRemoveService(service.service_id)
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleAddService(service)
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </>
                ) : (
                  // Vista seleccionados
                  <>
                    {localSelected.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No hay servicios seleccionados</p>
                        <p className="text-sm">Selecciona servicios del catálogo</p>
                      </div>
                    ) : (
                      localSelected.map((sel) => (
                        <div key={sel.serviceId} className="p-4 rounded-xl border bg-card space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">{sel.serviceName}</h4>
                              <p className="text-sm text-muted-foreground">
                                Precio base sugerido
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveService(sel.serviceId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Cantidad
                              </label>
                              <NumberInput
                                value={sel.cantidad}
                                onChange={(val) => handleCantidadChange(sel.serviceId, val || 1)}
                                min={1}
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Precio Unitario
                              </label>
                              <NumberInput
                                value={sel.precio_unitario}
                                onChange={(val) => handlePrecioChange(sel.serviceId, val || 0)}
                                min={0}
                                className="h-8"
                                isPrice
                              />
                            </div>
                          </div>

                          <div className="pt-2 border-t">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Subtotal:</span>
                              <span className="font-semibold">{formatPriceCLP(sel.subtotal)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Panel derecho — resumen */}
          <div className="w-full lg:w-80 flex flex-col bg-muted/20">
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Resumen de Servicios
              </h3>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {localSelected.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Selecciona servicios para ver el resumen
                  </p>
                ) : (
                  localSelected.map((sel) => (
                    <div key={sel.serviceId} className="p-3 rounded-lg bg-background border text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium truncate max-w-[150px]">{sel.serviceName}</span>
                        <span className="text-muted-foreground">x{sel.cantidad}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Precio unitario:</span>
                        <span>{formatPriceCLP(sel.precio_unitario)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium mt-1">
                        <span>Subtotal:</span>
                        <span>{formatPriceCLP(sel.subtotal)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Total */}
            <div className="p-4 border-t bg-background space-y-2">
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total Servicios:</span>
                <span className="text-primary">{formatPriceCLP(totalServicios)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {localSelected.length} servicio(s) seleccionado(s)
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={() => onConfirm(localSelected)} className="min-w-[140px]">
              <Check className="w-4 h-4 mr-2" />
              Aplicar Cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
