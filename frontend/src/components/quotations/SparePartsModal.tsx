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
import { 
  Package, 
  Search, 
  Plus, 
  Minus, 
  Check, 
  X, 
  Wrench, 
  ShoppingCart,
  Trash2,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Product, StockProduct } from "@/types/interfaces"

interface SelectedProduct {
  productId: number
  quantity: number
  laborPrice: number
  workProductDetailId?: number
  originalSalePrice?: number
  originalQuantity?: number
}

interface SparePartsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  stockProducts?: StockProduct[]
  selectedProducts: SelectedProduct[]
  onProductChange: (productId: number, quantity: number, laborPrice: number) => void
  onRemoveProduct: (productId: number) => void
  onConfirm: () => void
  onCancel: () => void
  onCreateProduct?: () => void
  calculatePrice: (salePrice: number, quantity: number, profitMargin: number) => number
  showStock?: boolean
  requireStock?: boolean // Si es true, solo permite seleccionar productos con stock disponible
  title?: string
  description?: string
}

export function SparePartsModal({
  open,
  onOpenChange,
  products,
  stockProducts = [],
  selectedProducts,
  onProductChange,
  onRemoveProduct,
  onConfirm,
  onCancel,
  onCreateProduct,
  calculatePrice,
  showStock = false,
  requireStock = false,
  title = "Seleccionar Repuestos",
  description = "Selecciona los productos y configura las cantidades y mano de obra"
}: SparePartsModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"available" | "selected">("available")

  // Obtener información de stock para un producto
  const getStockInfo = (productId: number) => {
    return stockProducts.find((sp) => sp.product?.product_id === productId)
  }

  // Filtrar y ordenar productos basado en la búsqueda y stock
  const filteredProducts = useMemo(() => {
    let result = products

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (product) =>
          product.product_name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query)
      )
    }

    // Ordenar: productos con stock primero (cuando showStock está activo)
    if (showStock) {
      result = [...result].sort((a, b) => {
        const stockA = stockProducts.find(sp => sp.product?.product_id === a.product_id)?.quantity || 0
        const stockB = stockProducts.find(sp => sp.product?.product_id === b.product_id)?.quantity || 0
        
        // Si ambos tienen stock o ninguno tiene, ordenar por nombre
        if ((stockA > 0 && stockB > 0) || (stockA === 0 && stockB === 0)) {
          return a.product_name.localeCompare(b.product_name)
        }
        
        // Productos con stock primero
        return stockB - stockA
      })
    }

    return result
  }, [products, searchQuery, showStock, stockProducts])

  // Verificar si un producto está seleccionado
  const isProductSelected = (productId: number) => {
    return selectedProducts.some((sp) => sp.productId === productId)
  }

  // Calcular totales
  const totals = useMemo(() => {
    let subtotalProducts = 0
    let totalLabor = 0

    selectedProducts.forEach(({ productId, quantity, laborPrice }) => {
      const product = products.find((p) => p.product_id === productId)
      if (product) {
        subtotalProducts += calculatePrice(
          Number(product.sale_price),
          quantity,
          Number(product.profit_margin)
        )
        totalLabor += laborPrice * quantity
      }
    })

    return {
      subtotalProducts,
      totalLabor,
      total: subtotalProducts + totalLabor
    }
  }, [selectedProducts, products, calculatePrice])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header mejorado */}
        <div className="px-6 py-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-5 h-5 text-primary" />
              </div>
              {title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col lg:flex-row h-[65vh]">
          {/* Panel izquierdo - Catálogo de productos */}
          <div className="flex-1 flex flex-col border-r">
            {/* Barra de búsqueda y tabs */}
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
                  <Package className="w-4 h-4 mr-2" />
                  Disponibles ({filteredProducts.length})
                </Button>
                <Button
                  variant={activeTab === "selected" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("selected")}
                  className="flex-1"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Seleccionados ({selectedProducts.length})
                </Button>
              </div>
            </div>

            {/* Lista de productos */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {activeTab === "available" ? (
                  <>
                    {onCreateProduct && (
                      <Button
                        variant="outline"
                        className="w-full mb-3 border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary"
                        onClick={onCreateProduct}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Crear nuevo producto
                      </Button>
                    )}

                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No se encontraron productos</p>
                        <p className="text-sm">Intenta con otro término de búsqueda</p>
                      </div>
                    ) : (
                      filteredProducts.map((product) => {
                        const isSelected = isProductSelected(product.product_id)
                        const stockInfo = getStockInfo(product.product_id)
                        const hasStock = stockInfo ? stockInfo.quantity > 0 : false
                        const isDisabled = requireStock && !hasStock && !isSelected
                        const unitPrice = calculatePrice(
                          Number(product.sale_price),
                          1,
                          Number(product.profit_margin)
                        )

                        return (
                          <div
                            key={product.product_id}
                            className={cn(
                              "group relative p-4 rounded-xl border transition-all duration-200",
                              isSelected
                                ? "bg-primary/5 border-primary shadow-sm cursor-pointer"
                                : isDisabled
                                  ? "bg-muted/50 border-muted opacity-60 cursor-not-allowed"
                                  : "bg-card hover:bg-accent/50 hover:border-primary/30 hover:shadow-sm cursor-pointer"
                            )}
                            onClick={() => {
                              if (!isSelected && !isDisabled) {
                                onProductChange(product.product_id, 1, 0)
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h4 className={cn(
                                    "font-semibold truncate",
                                    isDisabled ? "text-muted-foreground" : "text-foreground"
                                  )}>
                                    {product.product_name}
                                  </h4>
                                  {isSelected && (
                                    <Badge className="bg-primary/10 text-primary border-0">
                                      <Check className="w-3 h-3 mr-1" />
                                      Seleccionado
                                    </Badge>
                                  )}
                                  {isDisabled && (
                                    <Badge variant="destructive" className="text-xs">
                                      Sin stock
                                    </Badge>
                                  )}
                                </div>
                                
                                {product.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                    {product.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                  <Badge variant="secondary" className="font-mono">
                                    {formatPriceCLP(unitPrice)}
                                  </Badge>
                                  <Badge variant="outline" className="text-muted-foreground">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Margen: {product.profit_margin}%
                                  </Badge>
                                  {(showStock || requireStock) && stockInfo && (
                                    <Badge 
                                      variant={stockInfo.quantity > 0 ? "outline" : "destructive"}
                                      className={stockInfo.quantity > 0 ? "text-green-600 border-green-600/30" : ""}
                                    >
                                      Stock: {stockInfo.quantity}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {isSelected ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onRemoveProduct(product.product_id)
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                ) : !isDisabled ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onProductChange(product.product_id, 1, 0)
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </>
                ) : (
                  // Vista de productos seleccionados
                  <>
                    {selectedProducts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No hay productos seleccionados</p>
                        <p className="text-sm">Selecciona productos del catálogo</p>
                      </div>
                    ) : (
                      selectedProducts.map(({ productId, quantity, laborPrice }) => {
                        const product = products.find((p) => p.product_id === productId)
                        if (!product) return null

                        const stockInfo = getStockInfo(productId)
                        const maxQuantity = requireStock ? (stockInfo?.quantity || 1) : 999
                        const unitPrice = calculatePrice(
                          Number(product.sale_price),
                          1,
                          Number(product.profit_margin)
                        )
                        const totalPrice = unitPrice * quantity + laborPrice * quantity

                        return (
                          <div
                            key={productId}
                            className="p-4 rounded-xl border bg-card space-y-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground">
                                  {product.product_name}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Precio unitario: {formatPriceCLP(unitPrice)}
                                </p>
                                {requireStock && stockInfo && (
                                  <p className="text-xs text-green-600">
                                    Stock disponible: {stockInfo.quantity}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => onRemoveProduct(productId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              {/* Cantidad */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  Cantidad {requireStock && <span className="text-muted-foreground">(máx: {maxQuantity})</span>}
                                </label>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => onProductChange(productId, Math.max(1, quantity - 1), laborPrice)}
                                    disabled={quantity <= 1}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <NumberInput
                                    value={quantity}
                                    onChange={(val) => {
                                      const newVal = val || 1
                                      const clampedVal = requireStock ? Math.min(newVal, maxQuantity) : newVal
                                      onProductChange(productId, clampedVal, laborPrice)
                                    }}
                                    min={1}
                                    max={requireStock ? maxQuantity : undefined}
                                    className="h-8 w-16 text-center"
                                  />
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      const newQuantity = quantity + 1
                                      if (!requireStock || newQuantity <= maxQuantity) {
                                        onProductChange(productId, newQuantity, laborPrice)
                                      }
                                    }}
                                    disabled={requireStock && quantity >= maxQuantity}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* Mano de obra */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                  <Wrench className="w-3 h-3" />
                                  Mano de Obra
                                </label>
                                <NumberInput
                                  value={laborPrice}
                                  onChange={(val) => onProductChange(productId, quantity, val || 0)}
                                  min={0}
                                  className="h-8"
                                />
                              </div>
                            </div>

                            <div className="pt-2 border-t">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span className="font-semibold">{formatPriceCLP(totalPrice)}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Panel derecho - Resumen */}
          <div className="w-full lg:w-80 flex flex-col bg-muted/20">
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Resumen de Selección
              </h3>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {selectedProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Selecciona productos para ver el resumen
                  </p>
                ) : (
                  selectedProducts.map(({ productId, quantity, laborPrice }) => {
                    const product = products.find((p) => p.product_id === productId)
                    if (!product) return null

                    const unitPrice = calculatePrice(
                      Number(product.sale_price),
                      1,
                      Number(product.profit_margin)
                    )

                    return (
                      <div
                        key={productId}
                        className="p-3 rounded-lg bg-background border text-sm"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium truncate max-w-[150px]">
                            {product.product_name}
                          </span>
                          <span className="text-muted-foreground">x{quantity}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Producto:</span>
                          <span>{formatPriceCLP(unitPrice * quantity)}</span>
                        </div>
                        {laborPrice > 0 && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Mano de obra:</span>
                            <span>{formatPriceCLP(laborPrice * quantity)}</span>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>

            {/* Totales */}
            <div className="p-4 border-t bg-background space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal productos:</span>
                <span>{formatPriceCLP(totals.subtotalProducts)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total mano de obra:</span>
                <span>{formatPriceCLP(totals.totalLabor)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span className="text-primary">{formatPriceCLP(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedProducts.length} producto(s) seleccionado(s)
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={onConfirm} className="min-w-[140px]">
              <Check className="w-4 h-4 mr-2" />
              Aplicar Cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
