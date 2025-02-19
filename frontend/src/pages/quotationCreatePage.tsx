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
import { createWorkProductDetail } from "@/services/workProductDetail"
import type { Quotation, Vehicle, Product, StockProduct, WorkProductDetail } from "../types/interfaces"
import { fetchProducts } from "../services/productService"
import { getStockProducts } from "../services/stockProductService"
import type React from "react"
import { NumberInput } from "@/components/numberInput"
import { formatPriceCLP } from "@/utils/formatPriceCLP"

const QuotationCreatePage = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [vehicleQuery] = useState("")
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [stockProducts, setStockProducts] = useState<StockProduct[]>([])
  const [selectedProducts, setSelectedProducts] = useState<
    { productId: number; quantity: number; laborPrice: number }[]
  >([])
  const [showProductModal, setShowProductModal] = useState(false)
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  // Nuevo estado para los tabs: 0 = Personas, 1 = Empresas
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
  }, [])

  // Filtrar según consulta de búsqueda y tab seleccionado
  const filteredVehicles = vehicles.filter((v) => {
    const matchesQuery =
      vehicleQuery === "" ||
      `${v.license_plate} - ${v.model?.brand?.brand_name || ""} ${v.model?.model_name || ""} - ${v.owner ? v.owner.name : v.company?.name || ""}`
        .toLowerCase()
        .includes(vehicleQuery.toLowerCase())
    const matchesTab = selectedTabIndex === 0 ? !!v.owner : !!v.company
    return matchesQuery && matchesTab
  })

  const handleProductChange = (productId: number, quantity: number, laborPrice: number) => {
    setSelectedProducts((prevSelectedProducts) => {
      const existingProduct = prevSelectedProducts.find((p) => p.productId === productId)
      if (existingProduct) {
        return prevSelectedProducts.map((p) => (p.productId === productId ? { ...p, quantity, laborPrice } : p))
      } else {
        return [...prevSelectedProducts, { productId, quantity, laborPrice }]
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
      const newQuotation: Quotation = {
        vehicle_id: selectedVehicle.vehicle_id,
        description,
        quotation_Status: "pending",
        total_price: totalPrice,
      }

      console.log(newQuotation)

      const createdQuotation = await createQuotation(newQuotation)
      console.log(createdQuotation)
      console.log(createdQuotation.quotation?.quotation_id)
      const newWorkProductDetails: WorkProductDetail[] = selectedProducts.map(({ productId, quantity, laborPrice }) => {
        const product = products.find((p) => p.product_id === Number(productId))
        return {
          quotation_id: createdQuotation.quotation?.quotation_id,
          product_id: product?.product_id as number,
          quantity,
          labor_price: laborPrice,
          tax_id: 1, // default value, update if needed
          sale_price: product ? Number(product.sale_price) * quantity : 0, // default value, update if needed
          discount: 0, // default value, update if needed
        }
      })
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

  const totalProductPrice = selectedProducts.reduce((total, { productId, quantity }) => {
    const product = products.find((p) => p.product_id === Number(productId))
    return total + (product ? Number(product.sale_price) * quantity : 0)
  }, 0)

  const totalLaborPrice = selectedProducts.reduce((total, { laborPrice }) => total + laborPrice, 0)

  const totalPrice = totalProductPrice + totalLaborPrice

  return (
    <div className="container mx-auto p-6">
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Crear Nueva Cotización</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Vehículo</Label>
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
              <Label>Repuestos Seleccionados</Label>
              <Card>
                <CardContent className="p-4">
                  <ScrollArea className="h-[200px] pr-4">
                    <ul className="space-y-2">
                      {selectedProducts.map(({ productId, quantity, laborPrice }) => {
                        const product = products.find((p) => p.product_id === Number(productId))
                        const stockProduct = stockProducts.find((sp) => sp.product?.product_id === Number(productId))
                        return (
                          <li key={productId} className="flex items-center justify-between">
                            <span className="flex-1">
                              {product?.product_name} - {formatPriceCLP(Number(product?.sale_price))} - Stock:{" "}
                              {stockProduct?.quantity}
                            </span>
                            <div className="flex items-center space-x-2">
                              <div className="flex flex-col items-end">
                                <Label htmlFor={`quantity-${productId}`} className="text-xs">
                                  Cantidad
                                </Label>
                                <NumberInput
                                  id={`quantity-${productId}`}
                                  value={quantity}
                                  onChange={(newValue) => handleProductChange(productId, newValue, laborPrice)}
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
                                  onChange={(newValue) => handleProductChange(productId, quantity, newValue)}
                                  min={0}
                                  className="w-24"
                                  placeholder="Mano de obra"
                                  hideControls
                                  isPrice
                                />
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
                    <div className="text-right">Subtotal Productos: {formatPriceCLP(totalProductPrice)}</div>
                    <div className="text-right">Total Mano de Obra: {formatPriceCLP(totalLaborPrice)}</div>
                    <div className="text-right font-bold">Total: {formatPriceCLP(totalPrice)}</div>
                  </div>
                </CardContent>
              </Card>

              <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
                <Button onClick={() => setShowProductModal(true)}>Añadir Repuesto</Button>
                <DialogContent className="sm:max-w-[500px] bg-white">
                  <DialogHeader>
                    <DialogTitle>Seleccionar los repuestos a utilizar</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[400px] pr-4">
                    <ul className="space-y-4">
                      {products.map((product) => {
                        const stockProduct = stockProducts.find((sp) => sp.product?.product_id === product.product_id)
                        const selectedProduct = selectedProducts.find((p) => p.productId === product.product_id)
                        return (
                          <li key={product.product_id} className="flex items-center space-x-4">
                            <Checkbox
                              id={`product-${product.product_id}`}
                              checked={!!selectedProduct}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleProductChange(product.product_id, 1, 0)
                                } else {
                                  handleRemoveProduct(product.product_id)
                                }
                              }}
                            />
                            <Label htmlFor={`product-${product.product_id}`} className="flex-grow">
                              {product.product_name} - {formatPriceCLP(Number(product.sale_price))} - Stock:{" "}
                              {stockProduct?.quantity}
                            </Label>
                            {selectedProduct && (
                              <>
                                <div className="flex flex-col items-end">
                                  <Label htmlFor={`modal-quantity-${product.product_id}`} className="text-xs">
                                    Cantidad
                                  </Label>
                                  <NumberInput
                                    id={`modal-quantity-${product.product_id}`}
                                    value={selectedProduct.quantity}
                                    onChange={(newValue) =>
                                      handleProductChange(product.product_id, newValue, selectedProduct.laborPrice)
                                    }
                                    min={1}
                                    max={stockProduct?.quantity}
                                    className="w-20"
                                  />
                                </div>
                                <div className="flex flex-col items-end">
                                  <Label htmlFor={`modal-labor-${product.product_id}`} className="text-xs">
                                    Mano de obra
                                  </Label>
                                  <NumberInput
                                    id={`modal-labor-${product.product_id}`}
                                    value={selectedProduct.laborPrice}
                                    onChange={(newValue) =>
                                      handleProductChange(product.product_id, selectedProduct.quantity, newValue)
                                    }
                                    min={0}
                                    className="w-24"
                                    placeholder="Mano de obra"
                                    hideControls
                                    isPrice
                                  />
                                </div>
                              </>
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
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Ingrese la descripción de la cotización"
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Cotización"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default QuotationCreatePage

