import { useState } from "react";
import { Search, Car, User, Building2, FileText, Wrench, Calendar, Phone, Mail, Package, DollarSign, Wrench as Tool, ChevronDown, ChevronUp, Gauge, Palette, AlertCircle, CheckCircle2, Clock, TrendingUp, Hash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { fetchVehicleByLicensePlate } from "@/services/vehicleService";
import { toast } from "react-toastify";
import type { Vehicle, Quotation, WorkOrder } from "../types/interfaces";
import { formatQuantity } from "@/utils/formatQuantity";
import { formatPriceCLP as formatPrice } from "@/utils/formatPriceCLP";
import { formatDate } from "@/utils/formDate";

// Extender la interfaz Vehicle para incluir las propiedades adicionales que vienen del backend
interface VehicleWithDetails extends Vehicle {
  quotations?: Quotation[];
  workOrders?: WorkOrder[];
}

const VehicleSearchPage = () => {
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicle, setVehicle] = useState<VehicleWithDetails | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuotations, setExpandedQuotations] = useState<Set<number>>(new Set());
  const [expandedWorkOrders, setExpandedWorkOrders] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<string>("quotations");

  const handleSearch = async () => {
    if (!licensePlate.trim()) {
      toast.error("Por favor, ingrese una patente");
      return;
    }

    setLoading(true);
    setError(null);
    setVehicle(null);
    setQuotations([]);
    setWorkOrders([]);

    try {
      const foundVehicle = await fetchVehicleByLicensePlate(licensePlate.trim()) as VehicleWithDetails;
      setVehicle(foundVehicle);

      // Extraer las cotizaciones y órdenes de trabajo que vienen en la respuesta
      if (foundVehicle.quotations) {
        setQuotations(foundVehicle.quotations);
      }

      if (foundVehicle.workOrders) {
        setWorkOrders(foundVehicle.workOrders);
      }

      toast.success("Vehículo encontrado exitosamente");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Vehículo no encontrado en el sistema";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setLicensePlate("");
    setVehicle(null);
    setQuotations([]);
    setWorkOrders([]);
    setError(null);
    setExpandedQuotations(new Set());
    setExpandedWorkOrders(new Set());
  };

  const toggleQuotationExpanded = (quotationId: number) => {
    const newSet = new Set(expandedQuotations);
    if (newSet.has(quotationId)) {
      newSet.delete(quotationId);
    } else {
      newSet.add(quotationId);
    }
    setExpandedQuotations(newSet);
  };

  const toggleWorkOrderExpanded = (workOrderId: number) => {
    const newSet = new Set(expandedWorkOrders);
    if (newSet.has(workOrderId)) {
      newSet.delete(workOrderId);
    } else {
      newSet.add(workOrderId);
    }
    setExpandedWorkOrders(newSet);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { variant: 'outline' as const, label: 'Pendiente', className: 'border-amber-500 bg-amber-100 text-amber-800' },
      'approved': { variant: 'default' as const, label: 'Aprobada', className: 'bg-green-600 text-white' },
      'rejected': { variant: 'destructive' as const, label: 'Rechazada', className: '' },
      'not_started': { variant: 'outline' as const, label: 'No Iniciada', className: 'border-slate-400 bg-slate-100 text-slate-700' },
      'in_progress': { variant: 'secondary' as const, label: 'En Progreso', className: 'bg-blue-600 text-white' },
      'finished': { variant: 'default' as const, label: 'Completada', className: 'bg-green-600 text-white' },
      'cancelled': { variant: 'destructive' as const, label: 'Cancelada', className: '' }
    };

    return statusMap[status as keyof typeof statusMap] || { variant: 'outline' as const, label: status, className: 'border-slate-400 bg-slate-100 text-slate-700' };
  };

  // Función para calcular el precio con margen para productos
  const calculatePriceWithMargin = (basePrice: number, profitMargin: number) => {
    return basePrice * (1 + profitMargin / 100);
  };

  // Componente para mostrar detalles de productos mejorado
  const ProductDetailsComponent = ({ productDetails, title }: { productDetails: any[], title: string }) => {
    if (!productDetails || productDetails.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-200 rounded-full mb-3">
            <Package className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-600">No hay productos incluidos</p>
        </div>
      );
    }

    // Calcular totales
    const totalProducts = productDetails.reduce((acc, detail) => {
      const product = detail.product;
      const basePrice = Number(product?.sale_price || 0);
      const profitMargin = Number(product?.profit_margin || 0);
      const priceWithMargin = calculatePriceWithMargin(basePrice, profitMargin);
      return acc + (priceWithMargin * detail.quantity);
    }, 0);

    const totalLabor = productDetails.reduce((acc, detail) => acc + Number(detail.labor_price || 0), 0);
    const grandTotal = totalProducts + totalLabor;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold flex items-center gap-2 text-lg text-slate-800">
            <Package className="w-5 h-5 text-primary" />
            {title}
          </h4>
          <Badge variant="secondary" className="text-sm px-3 py-1 bg-slate-200 text-slate-700">
            {productDetails.length} {productDetails.length === 1 ? 'producto' : 'productos'}
          </Badge>
        </div>

        <div className="space-y-3">
          {productDetails.map((detail, index) => {
            const product = detail.product;
            const basePrice = Number(product?.sale_price || 0);
            const profitMargin = Number(product?.profit_margin || 0);
            const priceWithMargin = calculatePriceWithMargin(basePrice, profitMargin);
            const laborPrice = Number(detail.labor_price || 0);
            const quantity = detail.quantity;
            const totalProductPrice = priceWithMargin * quantity;
            const totalWithLabor = totalProductPrice + laborPrice;

            return (
              <Card key={index} className="border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden bg-white">
                <CardContent className="p-0">
                  {/* Header del producto */}
                  <div className="bg-gradient-to-r from-slate-100 to-transparent p-4 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-base text-slate-800">
                            {product?.product_name || 'Producto sin nombre'}
                          </h5>
                          {product?.description && (
                            <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0 border-slate-300 bg-white text-slate-700">
                        x{quantity}
                      </Badge>
                    </div>

                    {/* Tags de categoría */}
                    {(product?.type?.type_name || product?.type?.category?.category_name || product?.supplier?.name) && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {product?.type?.category?.category_name && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                            {product.type.category.category_name}
                          </Badge>
                        )}
                        {product?.type?.type_name && (
                          <Badge variant="outline" className="text-xs border-slate-300 bg-white text-slate-600">
                            {product.type.type_name}
                          </Badge>
                        )}
                        {product?.supplier?.name && (
                          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                            {product.supplier.name}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Detalles de precio */}
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Precio unitario y cantidad */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
                          <DollarSign className="w-3.5 h-3.5" />
                          Precio Producto
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Unitario:</span>
                            <span className="font-mono text-slate-700">{formatPrice(priceWithMargin)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Cantidad:</span>
                            <span className="font-semibold text-slate-700">{quantity}</span>
                          </div>
                          <Separator className="my-1.5" />
                          <div className="flex justify-between text-sm font-medium">
                            <span className="text-slate-600">Subtotal:</span>
                            <span className="text-primary font-mono">{formatPrice(totalProductPrice)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Mano de obra */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
                          <Tool className="w-3.5 h-3.5" />
                          Mano de Obra
                        </div>
                        <div className="flex items-center justify-between p-3 bg-orange-100 rounded-lg border border-orange-200">
                          <span className="text-sm text-orange-800">Instalación:</span>
                          <span className="font-semibold font-mono text-orange-700">
                            {formatPrice(laborPrice)}
                          </span>
                        </div>
                        {detail.discount && detail.discount > 0 && (
                          <div className="flex justify-between text-sm text-red-600">
                            <span>Descuento:</span>
                            <span>-{formatPrice(detail.discount)}</span>
                          </div>
                        )}
                      </div>

                      {/* Total del producto */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Total Ítem
                        </div>
                        <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg border border-green-200">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-700 font-mono">
                              {formatPrice(totalWithLabor)}
                            </p>
                            <p className="text-xs text-green-600 mt-0.5">
                              Producto + M.O.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Resumen de totales */}
        {productDetails.length > 1 && (
          <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h5 className="font-semibold text-lg flex items-center gap-2 text-slate-800">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Resumen de Productos
                </h5>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Total Productos</p>
                    <p className="font-semibold font-mono text-slate-700">{formatPrice(totalProducts)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Total M.O.</p>
                    <p className="font-semibold font-mono text-orange-600">{formatPrice(totalLabor)}</p>
                  </div>
                  <Separator orientation="vertical" className="h-10 hidden sm:block" />
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Gran Total</p>
                    <p className="text-xl font-bold font-mono text-primary">{formatPrice(grandTotal)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header mejorado con gradiente y diseño atractivo */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white py-12 md:py-16">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
              <Car className="w-5 h-5" />
              <span className="text-sm font-medium">Portal de Consulta</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Consulta tu Vehículo
            </h1>
            <p className="text-lg text-white/80 max-w-xl mx-auto">
              Ingresa la patente de tu vehículo para consultar su estado, cotizaciones y órdenes de trabajo en tiempo real
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8 -mt-8 relative z-20">
        {/* Formulario de búsqueda mejorado */}
        <Card className="max-w-2xl mx-auto shadow-xl border bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <CardTitle className="text-xl text-slate-800">Buscar por Patente</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Ingresa la patente del vehículo</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  placeholder="Ej: AABB10, AA-BB-10"
                  className="pl-12 h-14 text-center text-xl font-semibold tracking-wider border-2 border-slate-300 focus:border-primary transition-all !bg-white text-slate-800 placeholder:text-slate-400"
                  style={{ backgroundColor: 'white' }}
                  disabled={loading}
                />
                <Car className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSearch}
                  disabled={loading || !licensePlate.trim()}
                  size="lg"
                  className="h-14 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Buscar
                    </>
                  )}
                </Button>
                {(vehicle || error) && (
                  <Button variant="outline" onClick={clearSearch} size="lg" className="h-14 border-slate-300 bg-white hover:bg-slate-50 text-slate-700">
                    Limpiar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mensaje de error mejorado */}
        {error && (
          <Alert variant="destructive" className="max-w-2xl mx-auto border-2 shadow-lg">
            <AlertCircle className="w-5 h-5" />
            <AlertDescription className="text-base font-medium">{error}</AlertDescription>
          </Alert>
        )}

        {/* Resultado de búsqueda */}
        {vehicle && (
          <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            {/* Card principal del vehículo mejorada */}
            <Card className="overflow-hidden shadow-xl border bg-white">
              {/* Header del vehículo con gradiente */}
              <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 p-6 text-white">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                      <Car className="w-10 h-10" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-3xl font-bold tracking-wider">{vehicle.license_plate}</h2>
                        <Badge
                          variant={vehicle.vehicle_status === "running" ? "secondary" : "destructive"}
                          className={`text-sm px-3 py-1 ${vehicle.vehicle_status === "running" ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}
                        >
                          {vehicle.vehicle_status === "running" ? (
                            <><CheckCircle2 className="w-4 h-4 mr-1" /> Funcionando</>
                          ) : (
                            <><AlertCircle className="w-4 h-4 mr-1" /> Averiado</>
                          )}
                        </Badge>
                      </div>
                      <p className="text-xl text-white/90">
                        {vehicle.model?.brand?.brand_name} {vehicle.model?.model_name} {vehicle.year && `• ${vehicle.year}`}
                      </p>
                    </div>
                  </div>
                  {vehicle.mileage_history && vehicle.mileage_history.length > 0 && (
                    <div className="text-center md:text-right bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3">
                      <div className="flex items-center gap-2 justify-center md:justify-end text-white/80 text-sm mb-1">
                        <Gauge className="w-4 h-4" />
                        Kilometraje Actual
                      </div>
                      <p className="text-2xl font-bold">
                        {formatQuantity(vehicle.mileage_history[vehicle.mileage_history.length - 1].current_mileage)} km
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Información del vehículo */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Car className="w-5 h-5 text-primary" />
                      </div>
                      Detalles del Vehículo
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      {vehicle.year && (
                        <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                          <span className="flex items-center gap-2 text-slate-600">
                            <Calendar className="w-4 h-4" />
                            Año
                          </span>
                          <span className="font-semibold text-slate-800">{vehicle.year}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                        <span className="flex items-center gap-2 text-slate-600">
                          <Palette className="w-4 h-4" />
                          Color
                        </span>
                        <span className="font-semibold text-slate-800">{vehicle.color || "No especificado"}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                        <span className="flex items-center gap-2 text-slate-600">
                          <Hash className="w-4 h-4" />
                          Patente
                        </span>
                        <Badge variant="outline" className="font-mono text-base border-slate-300 text-slate-700 bg-white">{vehicle.license_plate}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Información del propietario */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {vehicle.owner ? <User className="w-5 h-5 text-primary" /> : <Building2 className="w-5 h-5 text-primary" />}
                      </div>
                      Propietario
                    </div>
                    <Separator />

                    {vehicle.owner ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-blue-100 rounded-lg border border-blue-200">
                          <User className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-xs text-blue-600 font-medium">Persona Natural</p>
                            <p className="font-semibold text-slate-800">{vehicle.owner.name} {vehicle.owner.first_surname}</p>
                          </div>
                        </div>
                        {vehicle.owner.number_phone && (
                          <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                            <span className="flex items-center gap-2 text-slate-600">
                              <Phone className="w-4 h-4" />
                              Teléfono
                            </span>
                            <a href={`tel:${vehicle.owner.number_phone}`} className="font-semibold text-primary hover:underline">
                              {vehicle.owner.number_phone}
                            </a>
                          </div>
                        )}
                        {vehicle.owner.email && (
                          <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                            <span className="flex items-center gap-2 text-slate-600">
                              <Mail className="w-4 h-4" />
                              Email
                            </span>
                            <a href={`mailto:${vehicle.owner.email}`} className="font-semibold text-primary hover:underline text-sm truncate max-w-[180px]">
                              {vehicle.owner.email}
                            </a>
                          </div>
                        )}
                      </div>
                    ) : vehicle.company ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-purple-100 rounded-lg border border-purple-200">
                          <Building2 className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="text-xs text-purple-600 font-medium">Empresa</p>
                            <p className="font-semibold text-slate-800">{vehicle.company.name}</p>
                          </div>
                        </div>
                        {vehicle.company.phone && (
                          <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                            <span className="flex items-center gap-2 text-slate-600">
                              <Phone className="w-4 h-4" />
                              Teléfono
                            </span>
                            <a href={`tel:${vehicle.company.phone}`} className="font-semibold text-primary hover:underline">
                              {vehicle.company.phone}
                            </a>
                          </div>
                        )}
                        {vehicle.company.email && (
                          <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                            <span className="flex items-center gap-2 text-slate-600">
                              <Mail className="w-4 h-4" />
                              Email
                            </span>
                            <a href={`mailto:${vehicle.company.email}`} className="font-semibold text-primary hover:underline text-sm truncate max-w-[180px]">
                              {vehicle.company.email}
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-6 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
                        <p className="text-slate-500 text-center">Sin propietario asignado</p>
                      </div>
                    )}
                  </div>

                  {/* Historial de kilometraje */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      Historial de Kilometraje
                    </div>
                    <Separator />
                    {vehicle.mileage_history && vehicle.mileage_history.length > 0 ? (
                      <div className="space-y-2">
                        {vehicle.mileage_history
                          .sort((a, b) => new Date(b.registration_date).getTime() - new Date(a.registration_date).getTime())
                          .slice(0, 4)
                          .map((record, index) => (
                            <div
                              key={record.mileage_history_id}
                              className={`flex justify-between items-center p-3 rounded-lg transition-colors ${index === 0
                                  ? 'bg-green-100 border border-green-200'
                                  : 'bg-slate-100 hover:bg-slate-200'
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-500" />
                                <span className={index === 0 ? 'font-medium text-slate-800' : 'text-slate-600'}>
                                  {formatDate(record.registration_date)}
                                </span>
                                {index === 0 && (
                                  <Badge variant="secondary" className="text-xs bg-green-200 text-green-800">
                                    Último
                                  </Badge>
                                )}
                              </div>
                              <Badge variant={index === 0 ? "default" : "outline"} className="font-mono">
                                {formatQuantity(record.current_mileage)} km
                              </Badge>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
                        <Gauge className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-slate-500 text-center">Sin registros de kilometraje</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs mejoradas para cotizaciones y órdenes de trabajo */}
            <Tabs defaultValue="quotations" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 h-14 p-1.5 bg-slate-100 border border-slate-200 rounded-xl shadow-sm">
                <TabsTrigger
                  value="quotations"
                  className={`flex items-center justify-center gap-2 h-full rounded-lg font-semibold transition-all duration-300 ${activeTab === 'quotations'
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>Cotizaciones</span>
                  <Badge variant="secondary" className={`ml-1 ${activeTab === 'quotations' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {quotations.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="workorders"
                  className={`flex items-center justify-center gap-2 h-full rounded-lg font-semibold transition-all duration-300 ${activeTab === 'workorders'
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  <Wrench className="w-5 h-5" />
                  <span>Órdenes de Trabajo</span>
                  <Badge variant="secondary" className={`ml-1 ${activeTab === 'workorders' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {workOrders.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="quotations" className="space-y-4 mt-6">
                <Card className="shadow-lg border bg-white">
                  <CardHeader className="bg-gradient-to-r from-orange-100 to-amber-100 border-b border-orange-200">
                    <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
                      <div className="p-2 bg-orange-200 rounded-lg">
                        <FileText className="w-6 h-6 text-orange-600" />
                      </div>
                      Cotizaciones para tu Vehículo
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Historial de cotizaciones realizadas para {vehicle.license_plate}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {quotations.length > 0 ? (
                      <div className="space-y-4">
                        {quotations.map((quotation, index) => (
                          <Card
                            key={quotation.quotation_id}
                            className="border-l-4 border-l-orange-500 hover:shadow-md transition-all duration-300 overflow-hidden bg-white"
                          >
                            <CardContent className="p-0">
                              <div className="p-5">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                  {/* Info izquierda */}
                                  <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <Badge
                                        variant={getStatusBadge(quotation.quotation_status).variant}
                                        className={`text-sm px-3 py-1 ${getStatusBadge(quotation.quotation_status).className}`}
                                      >
                                        {getStatusBadge(quotation.quotation_status).label}
                                      </Badge>
                                      <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Calendar className="w-4 h-4" />
                                        {quotation.entry_date ? formatDate(quotation.entry_date) : 'N/A'}
                                      </div>
                                      <Badge variant="outline" className="text-xs border-slate-300 text-slate-600 bg-white">
                                        #{index + 1}
                                      </Badge>
                                    </div>
                                    {quotation.description && (
                                      <p className="text-slate-600 bg-slate-100 p-3 rounded-lg text-sm">
                                        {quotation.description}
                                      </p>
                                    )}
                                  </div>

                                  {/* Info derecha - Precios */}
                                  <div className="lg:text-right space-y-1 p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl min-w-[200px] border border-green-200">
                                    <div className="text-xs text-slate-500 space-y-0.5">
                                      <div className="flex justify-between lg:justify-end gap-4">
                                        <span>Subtotal neto:</span>
                                        <span className="font-mono">{formatPrice(quotation.subtotal || (quotation.total_price / (1 + (quotation.tax_rate || 19) / 100)))}</span>
                                      </div>
                                      <div className="flex justify-between lg:justify-end gap-4">
                                        <span>IVA ({quotation.tax_rate || 19}%):</span>
                                        <span className="font-mono">{formatPrice(quotation.tax_amount || (quotation.total_price - (quotation.subtotal || (quotation.total_price / (1 + (quotation.tax_rate || 19) / 100)))))}</span>
                                      </div>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex items-center justify-between lg:justify-end gap-2">
                                      <span className="text-sm font-medium text-slate-600">Total:</span>
                                      <span className="text-2xl font-bold text-green-700">
                                        {formatPrice(quotation.total_price)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Collapsible para detalles de productos */}
                                {(quotation as any).productDetails && (quotation as any).productDetails.length > 0 && (
                                  <Collapsible
                                    open={expandedQuotations.has(quotation.quotation_id!)}
                                    onOpenChange={() => toggleQuotationExpanded(quotation.quotation_id!)}
                                    className="mt-4"
                                  >
                                    <CollapsibleTrigger asChild>
                                      <Button variant="outline" className="w-full h-12 border-dashed border-slate-300 hover:border-solid hover:bg-orange-50 transition-all bg-slate-100">
                                        <Package className="w-5 h-5 mr-2 text-orange-500" />
                                        <span className="font-medium text-slate-700">
                                          {expandedQuotations.has(quotation.quotation_id!) ? 'Ocultar' : 'Ver'} Detalles de Productos
                                        </span>
                                        <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700">
                                          {(quotation as any).productDetails.length}
                                        </Badge>
                                        {expandedQuotations.has(quotation.quotation_id!) ?
                                          <ChevronUp className="w-5 h-5 ml-2" /> :
                                          <ChevronDown className="w-5 h-5 ml-2" />
                                        }
                                      </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                      <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
                                        <ProductDetailsComponent
                                          productDetails={(quotation as any).productDetails}
                                          title="Productos de la Cotización"
                                        />
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-4">
                          <FileText className="w-10 h-10 text-orange-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-slate-800">Sin cotizaciones</h3>
                        <p className="text-slate-500">No hay cotizaciones disponibles para este vehículo</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="workorders" className="space-y-4 mt-6">
                <Card className="shadow-lg border bg-white">
                  <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-blue-200">
                    <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
                      <div className="p-2 bg-blue-200 rounded-lg">
                        <Wrench className="w-6 h-6 text-blue-600" />
                      </div>
                      Órdenes de Trabajo para tu Vehículo
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Historial de trabajos realizados o en proceso para {vehicle.license_plate}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {workOrders.length > 0 ? (
                      <div className="space-y-4">
                        {workOrders.map((workOrder, index) => (
                          <Card
                            key={workOrder.work_order_id}
                            className="border-l-4 border-l-blue-500 hover:shadow-md transition-all duration-300 overflow-hidden bg-white"
                          >
                            <CardContent className="p-0">
                              <div className="p-5">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                  {/* Info izquierda */}
                                  <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <Badge
                                        variant={getStatusBadge(workOrder.order_status || 'not_started').variant}
                                        className={`text-sm px-3 py-1 ${getStatusBadge(workOrder.order_status || 'not_started').className}`}
                                      >
                                        {getStatusBadge(workOrder.order_status || 'not_started').label}
                                      </Badge>
                                      <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Calendar className="w-4 h-4" />
                                        {workOrder.order_date ? formatDate(workOrder.order_date) : 'N/A'}
                                      </div>
                                      <Badge variant="outline" className="text-xs border-slate-300 text-slate-600 bg-white">
                                        #{index + 1}
                                      </Badge>
                                      {workOrder.quotation && (
                                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                          <FileText className="w-3 h-3 mr-1" />
                                          Cotización #{workOrder.quotation.quotation_id}
                                        </Badge>
                                      )}
                                    </div>
                                    {workOrder.description && (
                                      <p className="text-slate-600 bg-slate-100 p-3 rounded-lg text-sm">
                                        {workOrder.description}
                                      </p>
                                    )}
                                  </div>

                                  {/* Info derecha - Precios */}
                                  <div className="lg:text-right space-y-1 p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl min-w-[200px] border border-blue-200">
                                    <div className="text-xs text-slate-500 space-y-0.5">
                                      <div className="flex justify-between lg:justify-end gap-4">
                                        <span>Subtotal neto:</span>
                                        <span className="font-mono">{formatPrice(workOrder.subtotal || ((workOrder.total_amount || (workOrder.quotation?.total_price || 0)) / (1 + (workOrder.tax_rate || 19) / 100)))}</span>
                                      </div>
                                      <div className="flex justify-between lg:justify-end gap-4">
                                        <span>IVA ({workOrder.tax_rate || 19}%):</span>
                                        <span className="font-mono">{formatPrice(workOrder.tax_amount || ((workOrder.total_amount || (workOrder.quotation?.total_price || 0)) - (workOrder.subtotal || ((workOrder.total_amount || (workOrder.quotation?.total_price || 0)) / (1 + (workOrder.tax_rate || 19) / 100)))))}</span>
                                      </div>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex items-center justify-between lg:justify-end gap-2">
                                      <span className="text-sm font-medium text-slate-600">Total:</span>
                                      <span className="text-2xl font-bold text-blue-700">
                                        {formatPrice(workOrder.total_amount || (workOrder.quotation?.total_price || 0))}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Collapsible para detalles de productos */}
                                {(workOrder as any).productDetails && (workOrder as any).productDetails.length > 0 && (
                                  <Collapsible
                                    open={expandedWorkOrders.has(workOrder.work_order_id!)}
                                    onOpenChange={() => toggleWorkOrderExpanded(workOrder.work_order_id!)}
                                    className="mt-4"
                                  >
                                    <CollapsibleTrigger asChild>
                                      <Button variant="outline" className="w-full h-12 border-dashed border-slate-300 hover:border-solid hover:bg-blue-50 transition-all bg-slate-100">
                                        <Package className="w-5 h-5 mr-2 text-blue-500" />
                                        <span className="font-medium text-slate-700">
                                          {expandedWorkOrders.has(workOrder.work_order_id!) ? 'Ocultar' : 'Ver'} Detalles de Productos
                                        </span>
                                        <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                                          {(workOrder as any).productDetails.length}
                                        </Badge>
                                        {expandedWorkOrders.has(workOrder.work_order_id!) ?
                                          <ChevronUp className="w-5 h-5 ml-2" /> :
                                          <ChevronDown className="w-5 h-5 ml-2" />
                                        }
                                      </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                      <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
                                        <ProductDetailsComponent
                                          productDetails={(workOrder as any).productDetails}
                                          title="Productos de la Orden de Trabajo"
                                        />
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                          <Wrench className="w-10 h-10 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-slate-800">Sin órdenes de trabajo</h3>
                        <p className="text-slate-500">No hay órdenes de trabajo para este vehículo</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleSearchPage;
