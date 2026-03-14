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
import { ScrollArea } from "@/components/ui/scroll-area"
import { fetchVehicles } from "../services/vehicleService"
import { createQuotation } from "../services/quotationService"
import { getActiveTax } from "@/services/taxService"
import { createWorkProductDetail } from "@/services/workProductDetail"
import type { Quotation, Vehicle, Product, StockProduct, WorkProductDetail } from "../types/interfaces"
import { fetchProducts } from "../services/productService"
import { getStockProducts } from "../services/stockProductService"
import type React from "react"
import { NumberInput } from "@/components/numberInput"
import { formatPriceCLP } from "@/utils/formatPriceCLP"
import { QuickProductCreateDialog } from "@/components/products/QuickProductCreateDialog"
import { SparePartsModal } from "@/components/quotations/SparePartsModal"
import { ServiceSelectorModal } from "@/components/services/ServiceSelectorModal"
import { getServices, addServiceToQuotation } from "@/services/serviceApi"
import type { Service, SelectedService } from "@/types/service"

const fetchTax = async () => {
  try {
    const res = await getActiveTax()
    // Asegurar que tax_rate sea número (PostgreSQL puede devolverlo como string)
    const taxRateNum = Number(res.tax_rate)
    const TAX_RATE = taxRateNum / 100
    return { rate: TAX_RATE, taxId: res.tax_id, taxRatePercent: taxRateNum }
  } catch (error) {
    toast.error("Error al cargar el impuesto activo")
    return { rate: 0.19, taxId: 1, taxRatePercent: 19 } // Fallback a IVA 19%
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
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [activeTaxId, setActiveTaxId] = useState<number>(1);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(19);
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

    const fetchServicesData = async () => {
      try {
        const res = await getServices()
        setServices(res)
      } catch (error: any) {
        toast.error(error.message || "Error al cargar servicios")
      }
    }

    fetchVehiclesData();
    fetchProductsData();
    fetchStockProductsData();
    fetchServicesData();
    fetchTax().then((taxData) => {
      if (taxData) {
        setTaxRate(taxData.rate);
        setActiveTaxId(taxData.taxId);
        setTaxRatePercent(taxData.taxRatePercent);
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
    if (!selectedVehicle || (selectedProducts.length === 0 && selectedServices.length === 0)) {
      toast.error("Debe seleccionar un vehículo y al menos un producto o servicio")
      return
    }
    setLoading(true)
    try {
      // Crear cotización con la tasa de IVA histórica
      const newQuotation: Quotation = {
        vehicle_id: selectedVehicle.vehicle_id,
        quotation_status: "pending",
        total_price: Math.trunc(totalPrice),
        // Guardar la tasa de IVA del momento de creación (asegurar que sea número)
        tax_rate: Number(taxRatePercent),
        subtotal: Math.trunc(subtotalWithoutTax),
        tax_amount: Math.trunc(taxAmount),
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
            tax_id: activeTaxId, // Usar el ID del impuesto activo
            applied_tax_rate: taxRatePercent, // Guardar la tasa aplicada
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

      // Crear detalles de servicios
      const quotationId = createdQuotation.quotation?.quotation_id
      if (quotationId && selectedServices.length > 0) {
        await Promise.all(
          selectedServices.map((sel) =>
            addServiceToQuotation(quotationId, {
              service_id: sel.serviceId,
              cantidad: sel.cantidad,
              precio_unitario: sel.precio_unitario,
            })
          )
        )
      }

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

  const totalServicesPrice = selectedServices.reduce((acc, s) => acc + s.subtotal, 0)
  const subtotalWithoutTax = totalProductPrice + totalLaborPrice + totalServicesPrice
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
            {/* Sección de selección de vehículo - Diseño mejorado */}
            <div className="space-y-5 bg-gradient-to-br from-card to-muted/20 dark:from-card dark:to-muted/10 p-5 rounded-xl border border-border/50 shadow-sm">
              {/* Header de la sección */}
              <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                <div className="p-2.5 rounded-lg bg-primary/10 dark:bg-primary/20">
                  <Car className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <Label className="text-lg font-semibold text-foreground">Vehículo</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Selecciona el tipo de propietario y el vehículo</p>
                </div>
              </div>

              {/* Tabs mejorados con iconos */}
              <Tabs
                value={selectedTabIndex.toString()}
                onValueChange={(value) => setSelectedTabIndex(Number.parseInt(value))}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50 dark:bg-muted/20 rounded-lg gap-1">
                  <TabsTrigger
                    value="0"
                    className={cn(
                      "flex items-center justify-center gap-2 h-full rounded-md font-medium transition-all duration-200",
                      selectedTabIndex === 0
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-muted/30"
                    )}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Personas
                  </TabsTrigger>
                  <TabsTrigger
                    value="1"
                    className={cn(
                      "flex items-center justify-center gap-2 h-full rounded-md font-medium transition-all duration-200",
                      selectedTabIndex === 1
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-muted/30"
                    )}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Empresas
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Selector de vehículo mejorado */}
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                      "w-full justify-between h-12 px-4 font-normal",
                      "bg-background dark:bg-background/50 border-border/60",
                      "hover:bg-muted/50 dark:hover:bg-muted/20 hover:border-primary/50",
                      "transition-all duration-200",
                      !selectedVehicle && "text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {selectedVehicle ? (
                        <>
                          <div className="p-1 rounded bg-primary/10 dark:bg-primary/20">
                            <Car className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <span className="font-medium text-foreground truncate">
                            {selectedVehicle.license_plate} - {selectedVehicle.model?.brand?.brand_name} {selectedVehicle.model?.model_name}
                          </span>
                        </>
                      ) : (
                        <span>Seleccione un vehículo...</span>
                      )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command className="bg-popover">
                    <CommandInput placeholder="Buscar vehículo..." className="h-10" />
                    <CommandList>
                      <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                        No se encontró vehículo.
                      </CommandEmpty>
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
                              className="flex items-center gap-3 py-3 px-3 cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "h-4 w-4 text-primary",
                                  selectedVehicle?.vehicle_id === vehicle.vehicle_id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {vehicle.license_plate} - {vehicle.model?.brand?.brand_name}{" "}
                                  {vehicle.model?.model_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {vehicle.owner ? `👤 ${vehicle.owner.name}` : `🏢 ${vehicle.company?.name}`}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Sección de productos y servicios */}
            <div className="space-y-4 bg-accent/5 p-4 rounded-lg border">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Productos y Servicios
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setShowProductModal(true)}
                    variant="outline"
                    className="hover:accent hover:text-primary-foreground transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Producto
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowServiceModal(true)}
                    variant="outline"
                    className="hover:accent hover:text-primary-foreground transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Servicio
                  </Button>
                </div>
              </div>

              {/* Tarjeta de productos */}
              <Card className="bg-card shadow-sm">
                <CardContent className="p-4">
                  <ScrollArea className="h-[300px] pr-4">
                    <ul className="space-y-3">
                      {/* Servicios seleccionados */}
                      {selectedServices.map((sel) => (
                        <li
                          key={`service-${sel.serviceId}`}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">Servicio</span>
                              <p className="font-medium">{sel.serviceName}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Precio: {formatPriceCLP(sel.precio_unitario)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex flex-col items-end">
                              <Label className="text-xs">Cantidad</Label>
                              <NumberInput
                                value={sel.cantidad}
                                onChange={(val) =>
                                  setSelectedServices((prev) =>
                                    prev.map((s) =>
                                      s.serviceId === sel.serviceId
                                        ? { ...s, cantidad: val || 1, subtotal: (val || 1) * s.precio_unitario }
                                        : s
                                    )
                                  )
                                }
                                min={1}
                                className="w-20"
                              />
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-xs">Subtotal</span>
                              <span className="font-medium">{formatPriceCLP(sel.subtotal)}</span>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                setSelectedServices((prev) =>
                                  prev.filter((s) => s.serviceId !== sel.serviceId)
                                )
                              }
                            >
                              Eliminar
                            </Button>
                          </div>
                        </li>
                      ))}
                      {/* Productos seleccionados */}
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
                        {totalServicesPrice > 0 && (
                          <div className="flex justify-between p-2 rounded bg-accent/5">
                            <span>Subtotal Servicios:</span>
                            <span className="font-medium">{formatPriceCLP(totalServicesPrice)}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between p-2 rounded bg-accent/5">
                          <span>IVA ({taxRatePercent}%):</span>
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
          {/* Diálogo para seleccionar productos - Nuevo modal mejorado */}
          <SparePartsModal
            open={showProductModal}
            onOpenChange={setShowProductModal}
            products={products}
            stockProducts={stockProducts}
            selectedProducts={selectedProducts}
            onProductChange={handleProductChange}
            onRemoveProduct={handleRemoveProduct}
            onConfirm={() => setShowProductModal(false)}
            onCancel={() => setShowProductModal(false)}
            onCreateProduct={() => setShowCreateProductModal(true)}
            calculatePrice={calculateTotalWithMargin}
            showStock={true}
            title="Seleccionar Repuestos"
            description="Selecciona los productos para la cotización y configura cantidades y mano de obra"
          />

          <ServiceSelectorModal
            open={showServiceModal}
            onOpenChange={setShowServiceModal}
            services={services}
            selectedServices={selectedServices}
            onConfirm={(selected) => {
              setSelectedServices(selected)
              setShowServiceModal(false)
              if (selected.length > 0) toast.success("Servicios actualizados")
            }}
            onCancel={() => setShowServiceModal(false)}
            title="Seleccionar Servicios"
            description="Selecciona los servicios para la cotización y configura cantidades y precios"
          />

          <QuickProductCreateDialog
            open={showCreateProductModal}
            onOpenChange={setShowCreateProductModal}
            onProductCreated={(newProduct) => {
              setProducts((prev) => [...prev, newProduct])
              handleProductChange(newProduct.product_id, 1, 0)
              toast.success("Producto agregado a la cotización")
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default QuotationCreatePage
