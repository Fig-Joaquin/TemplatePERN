import { useState } from "react";
import { Search, Car, User, Building2, FileText, Wrench, Calendar, Phone, Mail, Package, DollarSign, Wrench as Tool, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
      'pending': { variant: 'outline' as const, label: 'Pendiente' },
      'approved': { variant: 'default' as const, label: 'Aprobada' },
      'rejected': { variant: 'destructive' as const, label: 'Rechazada' },
      'not_started': { variant: 'outline' as const, label: 'No Iniciada' },
      'in_progress': { variant: 'secondary' as const, label: 'En Progreso' },
      'finished': { variant: 'default' as const, label: 'Completada' },
      'cancelled': { variant: 'destructive' as const, label: 'Cancelada' }
    };
    
    return statusMap[status as keyof typeof statusMap] || { variant: 'outline' as const, label: status };
  };

  // Función para calcular el precio con margen para productos
  const calculatePriceWithMargin = (basePrice: number, profitMargin: number) => {
    return basePrice * (1 + profitMargin / 100);
  };

  // Componente para mostrar detalles de productos
  const ProductDetailsComponent = ({ productDetails, title }: { productDetails: any[], title: string }) => {
    if (!productDetails || productDetails.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No hay productos incluidos</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h4 className="font-semibold flex items-center gap-2">
          <Package className="w-4 h-4" />
          {title} ({productDetails.length})
        </h4>
        <div className="grid gap-3">
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
              <Card key={index} className="border border-muted">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Información del producto */}
                    <div className="space-y-2">
                      <h5 className="font-semibold text-primary">
                        {product?.product_name || 'Producto sin nombre'}
                      </h5>
                      {product?.description && (
                        <p className="text-sm text-muted-foreground">
                          {product.description}
                        </p>
                      )}
                      <div className="space-y-1 text-sm">
                        {product?.type?.type_name && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {product.type.type_name}
                            </Badge>
                            {product.type.category?.category_name && (
                              <Badge variant="secondary" className="text-xs">
                                {product.type.category.category_name}
                              </Badge>
                            )}
                          </div>
                        )}
                        {product?.supplier?.name && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Proveedor:</span>
                            <span>{product.supplier.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Información de precios */}
                    <div className="space-y-2">
                      <h6 className="font-medium flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Precios
                      </h6>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between font-medium">
                          <span>Precio unitario:</span>
                          <span>{formatPrice(priceWithMargin)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cantidad:</span>
                          <Badge variant="outline">{quantity}</Badge>
                        </div>
                        <div className="flex justify-between font-medium text-primary">
                          <span>Subtotal productos:</span>
                          <span>{formatPrice(totalProductPrice)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Información de mano de obra y totales */}
                    <div className="space-y-2">
                      <h6 className="font-medium flex items-center gap-1">
                        <Tool className="w-3 h-3" />
                        Mano de Obra & Total
                      </h6>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mano de obra:</span>
                          <span>{formatPrice(laborPrice)}</span>
                        </div>
                        <div className="border-t pt-1">
                          <div className="flex justify-between font-bold text-lg text-primary">
                            <span>Total:</span>
                            <span>{formatPrice(totalWithLabor)}</span>
                          </div>
                        </div>
                        {detail.discount && detail.discount > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Descuento:</span>
                            <span>-{formatPrice(detail.discount)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Consulta tu Vehículo</h1>
            <p className="text-primary-foreground/80">
              Ingresa la patente de tu vehículo para consultar su estado, cotizaciones y órdenes de trabajo
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Formulario de búsqueda */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center">
              <Search className="w-5 h-5" />
              Buscar Vehículo por Patente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  placeholder="Ej: AABB10, AA-BB-10"
                  className="pl-10 text-center text-lg"
                  disabled={loading}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              </div>
              <Button onClick={handleSearch} disabled={loading || !licensePlate.trim()} size="lg">
                {loading ? "Buscando..." : "Buscar"}
              </Button>
              {(vehicle || error) && (
                <Button variant="outline" onClick={clearSearch} size="lg">
                  Limpiar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mensaje de error */}
        {error && (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertDescription className="text-center">{error}</AlertDescription>
          </Alert>
        )}

        {/* Resultado de búsqueda */}
        {vehicle && (
          <div className="space-y-6">
            {/* Información básica del vehículo - mantener igual */}
            <Card>
              <CardHeader className="bg-primary/10">
                <CardTitle className="flex items-center gap-2 justify-center">
                  <Car className="w-6 h-6" />
                  {vehicle.license_plate}
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {vehicle.model?.brand?.brand_name} {vehicle.model?.model_name}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Información del vehículo */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Car className="w-5 h-5" />
                      Información del Vehículo
                    </h3>
                    
                    {vehicle.year && (
                      <div className="flex justify-between">
                        <span className="font-medium">Año:</span>
                        <span>{vehicle.year}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="font-medium">Color:</span>
                      <span>{vehicle.color || "No especificado"}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium">Estado:</span>
                      <Badge variant={vehicle.vehicle_status === "running" ? "secondary" : "destructive"}>
                        {vehicle.vehicle_status === "running" ? "Funcionando" : "Averiado"}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium">Kilometraje actual:</span>
                      <span>
                        {vehicle.mileage_history && vehicle.mileage_history.length > 0
                          ? formatQuantity(vehicle.mileage_history[vehicle.mileage_history.length - 1].current_mileage) + " km"
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Información del propietario */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {vehicle.owner ? <User className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                      Propietario
                    </h3>
                    
                    {vehicle.owner ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-4 h-4" />
                          <span>Persona Natural</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Nombre:</span>
                          <span>{vehicle.owner.name} {vehicle.owner.first_surname}</span>
                        </div>
                        {vehicle.owner.number_phone && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Teléfono:</span>
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{vehicle.owner.number_phone}</span>
                            </div>
                          </div>
                        )}
                        {vehicle.owner.email && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Email:</span>
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span className="text-sm">{vehicle.owner.email}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : vehicle.company ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="w-4 h-4" />
                          <span>Empresa</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Nombre:</span>
                          <span>{vehicle.company.name}</span>
                        </div>
                        {vehicle.company.phone && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Teléfono:</span>
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{vehicle.company.phone}</span>
                            </div>
                          </div>
                        )}
                        {vehicle.company.email && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Email:</span>
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span className="text-sm">{vehicle.company.email}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Sin propietario asignado</span>
                    )}
                  </div>

                  {/* Historial de kilometraje reciente */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Kilometraje Reciente
                    </h3>
                    {vehicle.mileage_history && vehicle.mileage_history.length > 0 ? (
                      <div className="space-y-2">
                        {vehicle.mileage_history
                          .sort((a, b) => new Date(b.registration_date).getTime() - new Date(a.registration_date).getTime())
                          .slice(0, 3)
                          .map((record) => (
                            <div key={record.mileage_history_id} className="flex justify-between items-center text-sm">
                              <span>{formatDate(record.registration_date)}</span>
                              <Badge variant="outline">
                                {formatQuantity(record.current_mileage)} km
                              </Badge>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin registros</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="quotations" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger className={activeTab === 'quotations' ? 'bg-primary text-destructive-foreground font-bold scale-105 shadow-md' : ''} value="quotations" >
                  <FileText className="w-4 h-4" />
                  Cotizaciones ({quotations.length})
                </TabsTrigger>
                <TabsTrigger className={activeTab === 'workorders' ? 'bg-primary text-destructive-foreground font-bold scale-105 shadow-md' : ''} value="workorders" >
                  <Wrench className="w-4 h-4" />
                  Órdenes de Trabajo ({workOrders.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="quotations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Cotizaciones para tu Vehículo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {quotations.length > 0 ? (
                      <div className="space-y-4">
                        {quotations.map((quotation) => (
                          <Card key={quotation.quotation_id} className="border-l-4 border-l-primary">
                            <CardContent className="pt-4">
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="font-medium">Estado:</span>
                                      <Badge variant={getStatusBadge(quotation.quotation_status).variant}>
                                        {getStatusBadge(quotation.quotation_status).label}
                                      </Badge>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                      <span className="font-medium">Fecha:</span>
                                      <span>{quotation.entry_date ? formatDate(quotation.entry_date) : 'N/A'}</span>
                                    </div>
                                    {quotation.description && (
                                      <div className="mb-2">
                                        <span className="font-medium">Descripción:</span>
                                        <p className="text-sm text-muted-foreground mt-1">{quotation.description}</p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="space-y-1 text-sm">
                                      <div className="text-sm text-muted-foreground">
                                        Subtotal neto: {formatPrice(quotation.total_price / 1.19)}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        IVA (19%): {formatPrice(quotation.total_price * 0.19 / 1.19)}
                                      </div>
                                    </div>
                                    <div className="text-2xl font-bold text-primary">
                                      {formatPrice(quotation.total_price)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Total con IVA
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Collapsible para detalles de productos */}
                                {(quotation as any).productDetails && (quotation as any).productDetails.length > 0 && (
                                  <Collapsible 
                                    open={expandedQuotations.has(quotation.quotation_id!)}
                                    onOpenChange={() => toggleQuotationExpanded(quotation.quotation_id!)}
                                  >
                                    <CollapsibleTrigger asChild>
                                      <Button variant="outline" className="w-full">
                                        <Package className="w-4 h-4 mr-2" />
                                        {expandedQuotations.has(quotation.quotation_id!) ? 'Ocultar' : 'Ver'} Detalles de Productos ({(quotation as any).productDetails.length})
                                        {expandedQuotations.has(quotation.quotation_id!) ? 
                                          <ChevronUp className="w-4 h-4 ml-2" /> : 
                                          <ChevronDown className="w-4 h-4 ml-2" />
                                        }
                                      </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-4">
                                      <ProductDetailsComponent 
                                        productDetails={(quotation as any).productDetails} 
                                        title="Productos de la Cotización"
                                      />
                                    </CollapsibleContent>
                                  </Collapsible>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No hay cotizaciones disponibles para este vehículo</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="workorders" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="w-5 h-5" />
                      Órdenes de Trabajo para tu Vehículo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {workOrders.length > 0 ? (
                      <div className="space-y-4">
                        {workOrders.map((workOrder) => (
                          <Card key={workOrder.work_order_id} className="border-l-4 border-l-blue-500">
                            <CardContent className="pt-4">
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="font-medium">Estado:</span>
                                      <Badge variant={getStatusBadge(workOrder.order_status || 'not_started').variant}>
                                        {getStatusBadge(workOrder.order_status || 'not_started').label}
                                      </Badge>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                      <span className="font-medium">Fecha:</span>
                                      <span>{workOrder.order_date ? formatDate(workOrder.order_date) : 'N/A'}</span>
                                    </div>
                                    {workOrder.description && (
                                      <div className="mb-2">
                                        <span className="font-medium">Descripción:</span>
                                        <p className="text-sm text-muted-foreground mt-1">{workOrder.description}</p>
                                      </div>
                                    )}
                                    {workOrder.quotation && (
                                      <div className="mb-2">
                                        <span className="font-medium">Basado en cotización:</span>
                                        <Badge variant="outline" className="ml-2">
                                          #{workOrder.quotation.quotation_id}
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="space-y-1 text-sm">
                                      <div className="text-sm text-muted-foreground">
                                        Subtotal neto: {formatPrice((workOrder.total_amount || (workOrder.quotation?.total_price || 0)) / 1.19)}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        IVA (19%): {formatPrice((workOrder.total_amount || (workOrder.quotation?.total_price || 0)) * 0.19 / 1.19)}
                                      </div>
                                    </div>
                                    <div className="text-xl font-bold text-primary">
                                      {formatPrice(workOrder.total_amount || (workOrder.quotation?.total_price || 0))}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {workOrder.quotation ? 'Total con IVA' : 'Total con IVA'}
                                    </div>
                                  </div>
                                </div>

                                {/* Collapsible para detalles de productos */}
                                {(workOrder as any).productDetails && (workOrder as any).productDetails.length > 0 && (
                                  <Collapsible 
                                    open={expandedWorkOrders.has(workOrder.work_order_id!)}
                                    onOpenChange={() => toggleWorkOrderExpanded(workOrder.work_order_id!)}
                                  >
                                    <CollapsibleTrigger asChild>
                                      <Button variant="outline" className="w-full">
                                        <Package className="w-4 h-4 mr-2" />
                                        {expandedWorkOrders.has(workOrder.work_order_id!) ? 'Ocultar' : 'Ver'} Detalles de Productos ({(workOrder as any).productDetails.length})
                                        {expandedWorkOrders.has(workOrder.work_order_id!) ? 
                                          <ChevronUp className="w-4 h-4 ml-2" /> : 
                                          <ChevronDown className="w-4 h-4 ml-2" />
                                        }
                                      </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-4">
                                      <ProductDetailsComponent 
                                        productDetails={(workOrder as any).productDetails} 
                                        title="Productos de la Orden de Trabajo"
                                      />
                                    </CollapsibleContent>
                                  </Collapsible>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No hay órdenes de trabajo para este vehículo</p>
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
