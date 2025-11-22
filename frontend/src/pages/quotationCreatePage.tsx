"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { toast } from "react-toastify"
import { Check, ChevronsUpDown, FileText, Car, Package, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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

// La interfaz SelectedProduct ya no incluye el margen
interface SelectedProduct {
  productId: number
  quantity: number
  laborPrice: number
}

const QuotationCreatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const vehicleIdFromUrl = queryParams.get('vehicleId');
  
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleQuery] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockProducts, setStockProducts] = useState<StockProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  useEffect(() => {
    const fetchVehiclesData = async () => {
      try {
        const res = await fetchVehicles();
        setVehicles(res);
        
        // Si hay un vehicleId en la URL, seleccionar ese vehículo
        if (vehicleIdFromUrl) {
          const vehicleFromUrl = res.find(v => v.vehicle_id === Number(vehicleIdFromUrl));
          if (vehicleFromUrl) {
            setSelectedVehicle(vehicleFromUrl);
          }
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || error.message || "Error al cargar vehículos");
      }
    };
    
    const fetchProductsData = async () => {
      try {
        const res = await fetchProducts();
        setProducts(res);
      } catch (error: any) {
        toast.error(error.response?.data?.message || error.message || "Error al cargar productos");
      }
    }

    const fetchStockProductsData = async () => {
      try {
        const res = await getStockProducts()
        setStockProducts(res)
      } catch (error: any) {
        toast.error(error.response?.data?.message || error.message || "Error al cargar stock de productos")
      }
    }

    fetchVehiclesData();
    fetchProductsData();
    fetchStockProductsData();
    fetchTax().then((rate) => {
      if (rate !== undefined) {
        setTaxRate(rate);
      }
    });
  }, [vehicleIdFromUrl]);

  const filteredVehicles = vehicles.filter((v) => {
    const matchesQuery =
      vehicleQuery === "" ||
      `${v.license_plate} - ${v.model?.brand?.brand_name || ""} ${v.model?.model_name || ""} - ${v.owner ? v.owner.name : v.company?.name || ""
        }`
        .toLowerCase()
        .includes(vehicleQuery.toLowerCase())
    const matchesTab = selectedTabIndex === 0 ? !!v.owner : !!v.company
    return matchesQuery && matchesTab
  })

  // Actualizamos handleProductChange sin manejar margen
  const handleProductChange = (productId: number, quantity: number, laborPrice: number) => {
    setSelectedProducts((prevSelectedProducts) => {
      const existingProduct = prevSelectedProducts.find((p) => p.productId === productId)
      if (existingProduct) {
        return prevSelectedProducts.map((p) =>
          p.productId === productId ? { ...p, quantity, laborPrice } : p,
        )
      } else {
        return [...prevSelectedProducts, { productId, quantity, laborPrice }]
      }
    })
  }

  const handleRemoveProduct = (productId: number) => {
    setSelectedProducts((prevSelectedProducts) =>
      prevSelectedProducts.filter((p) => p.productId !== productId),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVehicle || selectedProducts.length === 0) {
      toast.error("Debe seleccionar un vehículo y al menos un producto")
      return
    }
    setLoading(true)
    try {
      const newQuotation: Quotation = {
        vehicle_id: selectedVehicle.vehicle_id,
        quotation_status: "pending",
        total_price: Math.trunc(totalPrice),
        ...(description && description.trim() !== "" && { description }),
      }

      const createdQuotation = await createQuotation(newQuotation)
      const newWorkProductDetails: WorkProductDetail[] = selectedProducts.map(
        ({ productId, quantity, laborPrice }) => {
          const product = products.find((p) => p.product_id === Number(productId))
          return {
            quotation_id: createdQuotation.quotation?.quotation_id,
            product_id: product?.product_id as number,
            quantity,
            labor_price: laborPrice,
            tax_id: 1, // Valor por defecto para IVA (19%)
            sale_price: product
              ? calculateTotalWithMargin(
                Number(product.sale_price),
                quantity,
                Number(product.profit_margin),
              )
              : 0,
            discount: 0,
          }
        },
      )
      await Promise.all(newWorkProductDetails.map((detail) => createWorkProductDetail(detail)))
      toast.success("Cotización creada exitosamente")
      navigate("/admin/cotizaciones")
    } catch (error: any) {
      console.log(error)
      toast.error(
        [
          error.response?.data?.message,
          error.response?.data?.errors?.map((e: any) => e.message).join(", "),
        ]
          .filter(Boolean)
          .join(", ") || "Error al crear la cotización",
      )
    } finally {
      setLoading(false)
    }
  }

  // Función que utiliza el margen del producto (profit_margin) en los cálculos
  const calculateTotalWithMargin = (price: number, quantity: number, profitMargin: number): number => {
    const total = price * quantity * (1 + profitMargin / 100);
    return Math.round(total * 100) / 100; // Redondea a 2 decimales
  };

  const totalProductPrice = selectedProducts.reduce((total, { productId, quantity }) => {
    const product = products.find((p) => p.product_id === Number(productId))
    return total + (product ? calculateTotalWithMargin(Number(product.sale_price), quantity, Number(product.profit_margin)) : 0)
  }, 0)

  const totalLaborPrice = selectedProducts.reduce((total, { laborPrice }) => {
    return total + (Number(laborPrice) || 0)  // Convertir a número y usar 0 si es inválido
  }, 0)

  const subtotalWithoutTax = totalProductPrice + totalLaborPrice
  const taxAmount = subtotalWithoutTax * taxRate
  const totalPrice = subtotalWithoutTax + taxAmount

  return (
    <div className="container mx-auto p-6">
      <Card className="bg-card shadow-lg border-t-4 border-t-primary">
        <CardHeader className="border-b bg-muted/50 pb-4">
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <FileText className="w-6 h-6" /> {/* Icono */}
            Crear Nueva Cotización
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Sección de selección de vehículo */}
            <div className="space-y-4 bg-accent/5 p-4 rounded-lg border">
              <Label className="text-lg font-semibold flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" /> {/* Icono */}
                Vehículo
              </Label>
              <Tabs
                value={selectedTabIndex.toString()}
                onValueChange={(value) => setSelectedTabIndex(Number.parseInt(value))}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger 
                    value="0" 
                    className={selectedTabIndex === 0 ? "bg-primary text-destructive-foreground font-bold scale-105 shadow-md" : ""}
                  >
                    Personas
                  </TabsTrigger>
                  <TabsTrigger 
                    value="1" 
                    className={selectedTabIndex === 1 ? "bg-primary text-destructive-foreground font-bold scale-105 shadow-md" : ""}
                  >
                    Empresas
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
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
                              {vehicle.license_plate} - {vehicle.model?.brand?.brand_name}{" "}
                              {vehicle.model?.model_name} -{" "}
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

            {/* Sección de productos */}
            <div className="space-y-4 bg-accent/5 p-4 rounded-lg border">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" /> {/* Icono */}
                  Repuestos Seleccionados
                </Label>
                <Button
                  type="button"
                  onClick={() => setShowProductModal(true)}
                  variant="outline"
                  className="hover:accent hover:text-primary-foreground transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2 " />
                  Añadir Repuesto
                </Button>
              </div>

              {/* Tarjeta de productos */}
              <Card className="bg-card shadow-sm">
                <CardContent className="p-4">
                  <ScrollArea className="h-[300px] pr-4">
                    <ul className="space-y-3">
                      {selectedProducts.map(({ productId, quantity, laborPrice }) => {
                        const product = products.find((p) => p.product_id === Number(productId))
                        const stockProduct = stockProducts.find(
                          (sp) => sp.product?.product_id === Number(productId),
                        )
                        const totalWithMargin = product
                          ? calculateTotalWithMargin(
                            Number(product.sale_price),
                            quantity,
                            Number(product.profit_margin),
                          )
                          : 0
                        return (
                          <li
                            key={productId}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/5 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{product?.product_name}</p>
                              {/* Se muestra el margen de ganancia del producto */}
                              <p className="text-xs text-gray-500">Margen: {product?.profit_margin}%</p>
                              <p className="text-sm text-muted-foreground">
                                Precio: {formatPriceCLP(Number(product?.sale_price))} - Stock: {stockProduct?.quantity || 0}
                                {(!stockProduct || stockProduct.quantity === 0) && (
                                  <span className="text-red-500 font-medium ml-1">(Sin stock)</span>
                                )}
                                {stockProduct && stockProduct.quantity > 0 && stockProduct.quantity < quantity && (
                                  <span className="text-orange-500 font-medium ml-1">(Stock insuficiente)</span>
                                )}
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
                                  onChange={(newValue) => handleProductChange(productId, newValue, laborPrice)}
                                  min={1}
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

                  {/* Sección de totales */}
                  <div className="mt-6 space-y-2 border-t pt-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between p-2 rounded bg-accent/5">
                          <span>Subtotal Productos:</span>
                          <span className="font-medium">{formatPriceCLP(totalProductPrice)}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-accent/5">
                          <span>Total Mano de Obra:</span>
                          <span className="font-medium">{formatPriceCLP(totalLaborPrice)}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between p-2 rounded bg-accent/5">
                          <span>IVA (19%):</span>
                          <span className="font-medium">{formatPriceCLP(taxAmount)}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-primary/10 font-bold">
                          <span>Total Final:</span>
                          <span>{formatPriceCLP(totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sección de descripción */}
            <div className="space-y-4 bg-accent/5 p-4 rounded-lg border">
              <Label htmlFor="description" className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> {/* Icono */}
                Descripción
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Ingrese la descripción de la cotización"
                className="w-full resize-none border rounded-md focus:ring-primary"
              />
            </div>

            {/* Botón de envío */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-lg transition-all hover:scale-[1.02]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Creando...
                </span>
              ) : (
                "Crear Cotización"
              )}
            </Button>
          </form>
          {/* Diálogo para seleccionar productos */}
          <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Seleccionar Repuestos
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Command>
                  <CommandInput placeholder="Buscar repuestos..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No se encontraron repuestos.</CommandEmpty>
                    <CommandGroup heading="Productos disponibles">
                      <ScrollArea className="h-[200px]">
                        {products
                          .map((product) => {
                            const stockProduct = stockProducts.find(
                              (sp) => sp.product?.product_id === product.product_id,
                            )
                            const selectedProduct = selectedProducts.find(
                              (sp) => sp.productId === product.product_id,
                            )
                            const isSelected = !!selectedProduct

                            return (
                              <CommandItem
                                key={product.product_id}
                                className="flex items-center justify-between p-2 cursor-pointer hover:bg-accent/5"
                                onSelect={() => {
                                  if (!isSelected) {
                                    handleProductChange(product.product_id, 1, 0)
                                  }
                                }}
                              >
                                <div className="flex items-center space-x-4 flex-1">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        handleProductChange(product.product_id, 1, 0)
                                      } else {
                                        handleRemoveProduct(product.product_id)
                                      }
                                    }}
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium">{product.product_name}</p>
                                    <p className="text-xs text-gray-500">Margen: {product.profit_margin}%</p>
                                    <p className="text-sm text-muted-foreground">
                                      Precio: {formatPriceCLP(Number(product.sale_price))} - Stock:{" "}
                                      {stockProduct?.quantity || 0}
                                    </p>
                                  </div>
                                </div>
                              </CommandItem>
                            )
                          })}
                      </ScrollArea>
                    </CommandGroup>
                  </CommandList>
                </Command>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowProductModal(false)}
                    className="hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}

export default QuotationCreatePage
