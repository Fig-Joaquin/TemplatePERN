"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchVehicles } from "../services/vehicleService"
import { createQuotation } from "../services/quotationService"
import { getTaxById } from "@/services/taxService"
import { createWorkProductDetail } from "@/services/workProductDetail"
import type { Quotation, Vehicle, Product, StockProduct, WorkProductDetail } from "../types/interfaces"
import { fetchProducts } from "../services/productService"
import { getStockProducts } from "../services/stockProductService"
import type React from "react"
import { NumberInput } from "@/components/numberInput"
import { formatPriceCLP } from "@/utils/formatPriceCLP"


const fetchTax = async () => {
  try {
    const res = await getTaxById(1)
    const TAX_RATE = res.tax_rate / 100
    return TAX_RATE
  } catch (error) {
    toast.error("Error al cargar stock de productos")
  }
}


interface SelectedProduct {
  productId: number
  quantity: number
  laborPrice: number
  profitMargin: number
}

const QuotationCreatePage = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [vehicleQuery] = useState("")
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [stockProducts, setStockProducts] = useState<StockProduct[]>([])
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
  const [showProductModal, setShowProductModal] = useState(false)
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [taxRate, setTaxRate] = useState<number>(0)
  const navigate = useNavigate()

  const [selectedTabIndex, setSelectedTabIndex] = useState(0)

  useEffect(() => {
    const fetchVehiclesData = async () => {
      try {
        const res = await fetchVehicles()
        setVehicles(res)
      } catch (error) {
        toast.error("Error al cargar vehículos")
      }
    }

    const fetchProductsData = async () => {
      try {
        const res = await fetchProducts()
        setProducts(res)
      } catch (error) {
        toast.error("Error al cargar productos")
      }
    }
    

    const fetchStockProductsData = async () => {
      try {
        const res = await getStockProducts()
        setStockProducts(res)
      } catch (error) {
        toast.error("Error al cargar stock de productos")
      }
    }

    fetchVehiclesData()
    fetchProductsData()
    fetchStockProductsData()
    fetchTax().then((rate) => {
      if (rate !== undefined) {
        setTaxRate(rate)
      }
    })
  }, [])

  const filteredVehicles = vehicles.filter((v) => {
    const matchesQuery =
      vehicleQuery === "" ||
      `${v.license_plate} - ${v.model?.brand?.brand_name || ""} ${v.model?.model_name || ""} - ${v.owner ? v.owner.name : v.company?.name || ""}`
        .toLowerCase()
        .includes(vehicleQuery.toLowerCase())
    const matchesTab = selectedTabIndex === 0 ? !!v.owner : !!v.company
    return matchesQuery && matchesTab
  })

  const handleProductChange = (productId: number, quantity: number, laborPrice: number, profitMargin: number) => {
    setSelectedProducts((prevSelectedProducts) => {
      const existingProduct = prevSelectedProducts.find((p) => p.productId === productId)
      if (existingProduct) {
        return prevSelectedProducts.map((p) =>
          p.productId === productId ? { ...p, quantity, laborPrice, profitMargin } : p,
        )
      } else {
        return [...prevSelectedProducts, { productId, quantity, laborPrice, profitMargin }]
      }
    })
  }

  const handleRemoveProduct = (productId: number) => {
    setSelectedProducts((prevSelectedProducts) => prevSelectedProducts.filter((p) => p.productId !== productId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVehicle || !description || selectedProducts.length === 0) {
      toast.error("Todos los campos son obligatorios")
      return
    }
    setLoading(true)
    try {
      console.log(Math.trunc(totalPrice))
      const newQuotation: Quotation = {
        vehicle_id: selectedVehicle.vehicle_id,
        description,
        quotation_Status: "pending",
        total_price: Math.trunc(totalPrice),
      }

      const createdQuotation = await createQuotation(newQuotation)
      const newWorkProductDetails: WorkProductDetail[] = selectedProducts.map(
        ({ productId, quantity, laborPrice, profitMargin }) => {
          const product = products.find((p) => p.product_id === Number(productId))
          return {
            quotation_id: createdQuotation.quotation?.quotation_id,
            product_id: product?.product_id as number,
            quantity,
            labor_price: laborPrice,
            tax_id: 1, // default value for 19% tax
            sale_price: product ? calculateTotalWithMargin(Number(product.sale_price), quantity, profitMargin) : 0,
            discount: 0, // default value, update if needed
          }
        },
      )
      await Promise.all(newWorkProductDetails.map((detail) => createWorkProductDetail(detail)))
      toast.success("Cotización creada exitosamente")
      navigate("/admin/cotizaciones")
    } catch (error: any) {
      console.log(error)
      toast.error(
        [error.response?.data?.message, error.response?.data?.errors?.map((e: any) => e.message).join(", ")]
          .filter(Boolean)
          .join(", ") || "Error al crear la cotización",
      )
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalWithMargin = (price: number, quantity: number, profitMargin: number) => {
    return price * quantity * (1 + profitMargin / 100)
  }

  const totalProductPrice = selectedProducts.reduce((total, { productId, quantity, profitMargin }) => {
    const product = products.find((p) => p.product_id === Number(productId))
    return total + (product ? calculateTotalWithMargin(Number(product.sale_price), quantity, profitMargin) : 0)
  }, 0)

  const totalLaborPrice = selectedProducts.reduce((total, { laborPrice }) => total + laborPrice, 0)

  const subtotalWithoutTax = totalProductPrice + totalLaborPrice
  const taxAmount = subtotalWithoutTax * taxRate
  const totalPrice = subtotalWithoutTax + taxAmount

  return (
    <div className="container mx-auto p-6">
      <Card className="bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Crear Nueva Cotización</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-lg font-semibold">Vehículo</Label>
              <Tabs
                value={selectedTabIndex.toString()}
                onValueChange={(value) => setSelectedTabIndex(Number.parseInt(value))}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="0">Personas</TabsTrigger>
                  <TabsTrigger value="1">Empresas</TabsTrigger>
                </TabsList>
              </Tabs>

              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                    {selectedVehicle
                      ? `${selectedVehicle.license_plate} - ${selectedVehicle.model?.brand?.brand_name} ${selectedVehicle.model?.model_name}`
                      : "Seleccione un vehículo..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar vehículo..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No se encontró vehículo.</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-72">
                          {filteredVehicles.map((vehicle) => (
                            <CommandItem
                              key={vehicle.vehicle_id}
                              value={vehicle.vehicle_id.toString()}
                              onSelect={() => {
                                setSelectedVehicle(vehicle)
                                setOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedVehicle?.vehicle_id === vehicle.vehicle_id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {vehicle.license_plate} - {vehicle.model?.brand?.brand_name} {vehicle.model?.model_name} -{" "}
                              {vehicle.owner ? vehicle.owner.name : vehicle.company?.name}
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-semibold">Repuestos Seleccionados</Label>
              <Card className="bg-card shadow-sm">
                <CardContent className="p-4">
                  <ScrollArea className="h-[200px] pr-4">
                    <ul className="space-y-2">
                      {selectedProducts.map(({ productId, quantity, laborPrice, profitMargin }) => {
                        const product = products.find((p) => p.product_id === Number(productId))
                        const stockProduct = stockProducts.find((sp) => sp.product?.product_id === Number(productId))
                        const totalWithMargin = product
                          ? calculateTotalWithMargin(Number(product.sale_price), quantity, profitMargin)
                          : 0
                        return (
                          <li
                            key={productId}
                            className="flex items-center justify-between py-2 border-b last:border-b-0"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{product?.product_name}</p>
                              <p className="text-sm text-muted-foreground">
                                Precio: {formatPriceCLP(Number(product?.sale_price))} - Stock: {stockProduct?.quantity}
                              </p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex flex-col items-end">
                                <Label htmlFor={`quantity-${productId}`} className="text-xs">
                                  Cantidad
                                </Label>
                                <NumberInput
                                  id={`quantity-${productId}`}
                                  value={quantity}
                                  onChange={(newValue) =>
                                    handleProductChange(productId, newValue, laborPrice, profitMargin)
                                  }
                                  min={1}
                                  max={stockProduct?.quantity}
                                  className="w-20"
                                />
                              </div>
                              <div className="flex flex-col items-end">
                                <Label htmlFor={`labor-${productId}`} className="text-xs">
                                  Mano de obra
                                </Label>
                                <NumberInput
                                  id={`labor-${productId}`}
                                  value={laborPrice}
                                  onChange={(newValue) =>
                                    handleProductChange(productId, quantity, newValue, profitMargin)
                                  }
                                  min={0}
                                  className="w-24"
                                  placeholder="Mano de obra"
                                  hideControls
                                  isPrice
                                />
                              </div>
                              <div className="flex flex-col items-end">
                                <Label htmlFor={`margin-${productId}`} className="text-xs">
                                  Margen (%)
                                </Label>
                                <NumberInput
                                  id={`margin-${productId}`}
                                  value={profitMargin}
                                  onChange={(newValue) =>
                                    handleProductChange(productId, quantity, laborPrice, newValue)
                                  }
                                  min={0}
                                  max={100}
                                  className="w-20"
                                />
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-xs">Total</span>
                                <span className="font-medium">{formatPriceCLP(totalWithMargin + laborPrice)}</span>
                              </div>
                              <Button variant="destructive" size="sm" onClick={() => handleRemoveProduct(productId)}>
                                Eliminar
                              </Button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </ScrollArea>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal Productos (con margen):</span>
                      <span className="font-medium">{formatPriceCLP(totalProductPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Mano de Obra:</span>
                      <span className="font-medium">{formatPriceCLP(totalLaborPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total sin IVA:</span>
                      <span className="font-medium">{formatPriceCLP(subtotalWithoutTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA (19%):</span>
                      <span className="font-medium">{formatPriceCLP(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total con IVA:</span>
                      <span>{formatPriceCLP(totalPrice)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
                <Button onClick={() => setShowProductModal(true)} className="w-full">
                  Añadir Repuesto
                </Button>
                <DialogContent className="sm:max-w-[700px] bg-card">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-primary">Seleccionar Repuestos</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[400px] pr-4">
                    <ul className="space-y-4">
                      {products.map((product) => {
                        const stockProduct = stockProducts.find((sp) => sp.product?.product_id === product.product_id)
                        const selectedProduct = selectedProducts.find((p) => p.productId === product.product_id)
                        return (
                          <li
                            key={product.product_id}
                            className="flex items-center space-x-4 p-2 rounded-lg hover:bg-accent/10"
                          >
                            <Checkbox
                              id={`product-${product.product_id}`}
                              checked={!!selectedProduct}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleProductChange(product.product_id, 1, 0, product.profit_margin)
                                } else {
                                  handleRemoveProduct(product.product_id)
                                }
                              }}
                            />
                            <Label htmlFor={`product-${product.product_id}`} className="flex-grow cursor-pointer">
                              <span className="font-medium">{product.product_name}</span>
                              <span className="text-sm text-muted-foreground block">
                                Precio: {formatPriceCLP(Number(product.sale_price))} - Stock: {stockProduct?.quantity}
                              </span>
                            </Label>
                            {selectedProduct && (
                              <div className="flex items-center space-x-2">
                                <NumberInput
                                  id={`modal-quantity-${product.product_id}`}
                                  value={selectedProduct.quantity}
                                  onChange={(newValue) =>
                                    handleProductChange(
                                      product.product_id,
                                      newValue,
                                      selectedProduct.laborPrice,
                                      selectedProduct.profitMargin,
                                    )
                                  }
                                  min={1}
                                  max={stockProduct?.quantity}
                                  className="w-20"
                                />
                              </div>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-lg font-semibold">
                Descripción
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Ingrese la descripción de la cotización"
                className="w-full p-2 border rounded-md"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground">
              {loading ? "Creando..." : "Crear Cotización"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default QuotationCreatePage

