import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronsUpDown,
  Car,
  User,
  Building2,
  FileText,
  Calculator,
  Search,
  CheckCircle,
  Calendar,
  Package,
  DollarSign,
  ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { fetchVehicles } from "../../services/vehicleService";
import { fetchQuotations } from "../../services/quotationService";
import { createWorkOrder } from "../../services/workOrderService";
import { getWorkProductDetailsByQuotationId } from "../../services/workProductDetail";
import { getStockProducts, updateStockProduct } from "../../services/stockProductService";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { getActiveTax } from "@/services/taxService";
import { getChileanISOString, formatChileanDate } from "@/utils/dateUtils";
import { translateQuotationStatus } from "@/utils/statusTranslations";
import { cn } from "@/lib/utils";
import type { Vehicle, Quotation, WorkProductDetail, WorkOrderInput, StockProduct } from "../../types/interfaces";

interface WorkOrderWithQuotationProps {
  preselectedVehicleId?: number;
}

const WorkOrderWithQuotation = ({ preselectedVehicleId }: WorkOrderWithQuotationProps) => {
  const navigate = useNavigate();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [openVehiclePopover, setOpenVehiclePopover] = useState(false);
  const [vehicleQuotations, setVehicleQuotations] = useState<Quotation[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [productDetails, setProductDetails] = useState<WorkProductDetail[]>([]);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(19);
  const [stockProducts, setStockProducts] = useState<StockProduct[]>([]);

  // Nuevo estado para filtrar el tipo: "all", "person" o "company"
  const [selectedType, setSelectedType] = useState<"all" | "person" | "company">("all");

  // Carga inicial de vehículos y stock products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehiclesData = await fetchVehicles();
        setVehicles(vehiclesData);

        // Si hay un ID de vehículo preseleccionado, seleccionarlo
        if (preselectedVehicleId) {
          const preselectedVehicle = vehiclesData.find(v => v.vehicle_id === preselectedVehicleId);
          if (preselectedVehicle) {
            setSelectedVehicle(preselectedVehicle);
          }
        }

        // Resto de la carga de datos...
        const stockData = await getStockProducts();
        setStockProducts(stockData);
      } catch (error: any) {
        toast.error(error.response?.data?.message || error.message || "Error al cargar datos iniciales");
      }
    };

    fetchData();
  }, [preselectedVehicleId]);

  // Función para generar descripción automática
  const generateAutoDescription = (vehicle: Vehicle, quotation?: any): string => {
    const vehicleInfo = `${vehicle.model?.brand?.brand_name} ${vehicle.model?.model_name} - ${vehicle.license_plate}`.trim();
    const quotationInfo = quotation ? ` basada en la cotización #${quotation.quotation_id}` : '';

    if (vehicle.owner) {
      return `Orden de trabajo para ${vehicleInfo} del propietario ${vehicle.owner.name}${quotationInfo}`;
    } else if (vehicle.company) {
      return `Orden de trabajo para ${vehicleInfo} de la empresa ${vehicle.company.name}${quotationInfo}`;
    } else {
      return `Orden de trabajo para ${vehicleInfo}${quotationInfo}`;
    }
  };

  // Carga del tax rate
  useEffect(() => {
    const fetchTax = async () => {
      try {
        const res = await getActiveTax();
        // Asegurar que tax_rate sea número (PostgreSQL puede devolverlo como string)
        const taxRateNum = Number(res.tax_rate);
        const tax = taxRateNum / 100;
        setTaxRate(tax);
        setTaxRatePercent(taxRateNum);
      } catch (error: any) {
        toast.error(error.response?.data?.message || error.message || "Error al cargar impuesto");
      }
    };
    fetchTax();
  }, []);

  // Carga de cotizaciones para el vehículo seleccionado y las ordena por fecha descendente
  useEffect(() => {
    if (selectedVehicle) {
      fetchQuotations([])
        .then((allQuotations) => {
          const filtered = allQuotations.filter((q) => {
            const qVehicleId = q.vehicle_id || (q.vehicle && q.vehicle.vehicle_id);
            return qVehicleId === selectedVehicle.vehicle_id;
          });
          filtered.sort(
            (a, b) => {
              const dateA = a.entry_date ? new Date(a.entry_date).getTime() : 0;
              const dateB = b.entry_date ? new Date(b.entry_date).getTime() : 0;
              return dateB - dateA;
            }
          );
          setVehicleQuotations(filtered);
        })
        .catch((error: any) => {
          toast.error(error.response?.data?.message || error.message || "Error al cargar cotizaciones para el vehículo");
        });
    } else {
      setVehicleQuotations([]);
      setSelectedQuotation(null);
    }
  }, [selectedVehicle]);

  // Actualizar descripción cuando se selecciona un vehículo o cotización
  useEffect(() => {
    if (selectedVehicle) {
      const autoDescription = generateAutoDescription(selectedVehicle, selectedQuotation);
      setDescription(autoDescription);
    }
  }, [selectedVehicle, selectedQuotation]);

  // Carga de detalle de productos para la cotización seleccionada
  useEffect(() => {
    if (selectedQuotation) {
      const fetchProductDetails = async () => {
        try {
          const details = await getWorkProductDetailsByQuotationId(
            selectedQuotation!.quotation_id!
          );
          setProductDetails(details);
        } catch (error: any) {
          toast.error(error.response?.data?.message || error.message || "Error al cargar detalles de productos");
        }
      };
      fetchProductDetails();
    } else {
      setProductDetails([]);
    }
  }, [selectedQuotation]);

  // Cálculo de totales
  const subtotal = productDetails.reduce(
    (sum, detail) =>
      sum +
      Number(detail.sale_price) * detail.quantity +
      Number(detail.labor_price),
    0
  );
  const taxAmount = subtotal * taxRate;
  const finalTotal = subtotal + taxAmount;

  // Verifica si hay suficiente stock para todos los productos en la cotización
  const verifyStockAvailability = (): boolean => {
    if (!productDetails.length) return true;

    let hasEnoughStock = true;

    // Check each product in the quotation details
    for (const detail of productDetails) {
      const stockProduct = stockProducts.find(sp =>
        sp.product?.product_id === detail.product_id
      );

      if (!stockProduct || stockProduct.quantity < detail.quantity) {
        const productName = detail.product?.product_name || `ID: ${detail.product_id}`;
        toast.error(`No hay suficiente stock para el producto: ${productName}`);
        hasEnoughStock = false;
        break;
      }
    }

    return hasEnoughStock;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !description || !selectedQuotation) {
      toast.error("El vehículo, la descripción y la cotización son obligatorios");
      return;
    }

    // Verify if there's enough stock for all products
    if (!verifyStockAvailability()) {
      return;
    }

    setLoading(true);
    try {
      // Calcular subtotal e IVA
      const subtotalWithoutTax = finalTotal / (1 + taxRate);
      const taxAmountCalc = finalTotal - subtotalWithoutTax;

      const workOrderPayload: Partial<WorkOrderInput> = {
        vehicle_id: selectedVehicle.vehicle_id,
        quotation_id: selectedQuotation.quotation_id,
        total_amount: Math.trunc(finalTotal),
        description,
        order_date: getChileanISOString(), // Usar formato ISO con hora chilena preservada
        // Guardar la tasa de IVA del momento de creación
        tax_rate: Number(taxRatePercent),
        subtotal: Math.trunc(subtotalWithoutTax),
        tax_amount: Math.trunc(taxAmountCalc),
      };

      console.log("Enviando orden con fecha chilena:", workOrderPayload.order_date);
      await createWorkOrder(workOrderPayload);

      // Update stock for each product in the quotation
      await updateProductStock();

      toast.success("Orden de trabajo creada exitosamente");
      navigate("/admin/orden-trabajo");
    } catch (error: any) {
      console.error("Error al crear la orden de trabajo:", error);
      toast.error(error.response?.data?.message || error.message || "Error al crear la orden de trabajo");
    } finally {
      setLoading(false);
    }
  };

  // Function to update stock quantities
  const updateProductStock = async () => {
    try {
      // For each product in the quotation, reduce its stock quantity
      for (const detail of productDetails) {
        const stockProduct = stockProducts.find(sp =>
          sp.product?.product_id === detail.product_id
        );

        if (stockProduct && stockProduct.stock_product_id !== undefined) {
          const updatedQuantity = Math.max(0, stockProduct.quantity - detail.quantity);

          // Update the stock in the database
          await updateStockProduct(stockProduct.stock_product_id.toString(), {
            quantity: updatedQuantity,
            updated_at: new Date()
          });
          console.log(`Stock updated for product ID: ${detail.product_id}`);
        }
      }
    } catch (error: any) {
      console.error("Error updating product stock:", error);
      toast.error(error.response?.data?.message || error.message || "Error al actualizar el inventario");
    }
  };

  // Filtrar vehículos según la pestaña seleccionada
  const filteredVehicles = vehicles.filter((v) => {
    const searchValue = vehicleQuery.toLowerCase();
    const vehicleInfo = [
      v.license_plate,
      v.model?.brand?.brand_name,
      v.model?.model_name,
      v.owner?.name,
      v.company?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    let matchesType = true;
    if (selectedType === "person") {
      matchesType = !!v.owner;
    } else if (selectedType === "company") {
      matchesType = !!v.company;
    }

    return vehicleInfo.includes(searchValue) && matchesType;
  });

  // Obtener el kilometraje actual del vehículo, a partir del registro más reciente
  const latestMileage = selectedQuotation?.vehicle?.mileage_history?.length
    ? selectedQuotation.vehicle.mileage_history.sort(
      (a, b) => new Date(b.registration_date).getTime() - new Date(a.registration_date).getTime()
    )[0].current_mileage
    : null;

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="mb-4 hover:shadow-md transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <Card className="border shadow-xl" style={{ backgroundColor: 'var(--card)' }}>
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl font-bold text-center">
                🔧 Crear Orden de Trabajo con Cotización
              </CardTitle>
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border shadow-xl" style={{ backgroundColor: 'var(--card)' }}>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Vehicle Type Filter */}
                <Card className="border shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Car className="w-5 h-5 text-blue-600" />
                      Filtro por Tipo de Propietario
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Button
                        variant={selectedType === "all" ? "default" : "outline"}
                        onClick={() => setSelectedType("all")}
                        type="button"
                        className="flex-1 transition-all duration-200"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Todos
                      </Button>
                      <Button
                        variant={selectedType === "person" ? "default" : "outline"}
                        onClick={() => setSelectedType("person")}
                        type="button"
                        className="flex-1 transition-all duration-200"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Personas
                      </Button>
                      <Button
                        variant={selectedType === "company" ? "default" : "outline"}
                        onClick={() => setSelectedType("company")}
                        type="button"
                        className="flex-1 transition-all duration-200"
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        Empresas
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Vehicle Selection */}
                <Card className="border shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Search className="w-5 h-5 text-green-600" />
                      Selección de Vehículo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <input
                        type="text"
                        value={vehicleQuery}
                        onChange={(e) => setVehicleQuery(e.target.value)}
                        placeholder="Buscar vehículo por patente, marca, modelo o propietario..."
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                      />
                      <Popover open={openVehiclePopover} onOpenChange={setOpenVehiclePopover}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:shadow-md transition-all duration-200"
                          >
                            <ChevronsUpDown className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full min-w-[600px]">
                          <ScrollArea className="h-80">
                            {filteredVehicles.length > 0 ? (
                              <div className="space-y-2">
                                {filteredVehicles.map((vehicle) => (
                                  <motion.button
                                    key={vehicle.vehicle_id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedVehicle(vehicle);
                                      setOpenVehiclePopover(false);
                                      setSelectedQuotation(null);
                                    }}
                                    className={cn(
                                      "w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-md",
                                      selectedVehicle?.vehicle_id === vehicle.vehicle_id
                                        ? "border-blue-300 shadow-sm"
                                        : "hover:opacity-80"
                                    )}
                                    style={{
                                      backgroundColor: selectedVehicle?.vehicle_id === vehicle.vehicle_id
                                        ? 'var(--stat-blue-bg)'
                                        : 'var(--card)',
                                      borderColor: selectedVehicle?.vehicle_id === vehicle.vehicle_id
                                        ? 'var(--balance-net-border)'
                                        : 'var(--border)'
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                          {vehicle.license_plate}
                                        </p>
                                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                                          {vehicle.model?.brand?.brand_name} {vehicle.model?.model_name}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                          {vehicle.owner ? vehicle.owner.name : vehicle.company?.name}
                                        </p>
                                      </div>
                                      {selectedVehicle?.vehicle_id === vehicle.vehicle_id && (
                                        <CheckCircle className="w-5 h-5 text-blue-600" />
                                      )}
                                    </div>
                                  </motion.button>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No se encontraron vehículos</p>
                              </div>
                            )}
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {selectedVehicle && (
                      <motion.div
                        className="mt-4 p-4 rounded-lg border"
                        style={{
                          backgroundColor: 'var(--stat-green-bg)',
                          borderColor: 'var(--balance-income-border)'
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--balance-income-border)' }}>
                            <CheckCircle className="w-5 h-5" style={{ color: 'var(--stat-green-text)' }} />
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
                              {selectedVehicle.license_plate} - {selectedVehicle.model?.brand?.brand_name}{" "}
                              {selectedVehicle.model?.model_name}
                            </p>
                            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                              Propietario: {selectedVehicle.owner ? selectedVehicle.owner.name : selectedVehicle.company?.name}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>

                {/* Quotations List */}
                {selectedVehicle && (
                  <Card className="border shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        Cotizaciones Disponibles
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {vehicleQuotations.length > 0 ? (
                        <div className="space-y-4">
                          {vehicleQuotations.map((q) => (
                            <motion.button
                              key={q.quotation_id}
                              type="button"
                              onClick={() => setSelectedQuotation(q)}
                              className={cn(
                                "w-full text-left p-4 rounded-lg border transition-all duration-200 hover:shadow-md",
                                selectedQuotation?.quotation_id === q.quotation_id
                                  ? "border-purple-300 shadow-sm"
                                  : "hover:opacity-80"
                              )}
                              style={{
                                backgroundColor: selectedQuotation?.quotation_id === q.quotation_id
                                  ? 'var(--stat-purple-bg)'
                                  : 'var(--card)',
                                borderColor: selectedQuotation?.quotation_id === q.quotation_id
                                  ? 'var(--stat-purple-text)'
                                  : 'var(--border)'
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Badge variant="outline" className="text-xs">
                                      ID: {q.quotation_id}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {translateQuotationStatus(q.quotation_status)}
                                    </Badge>
                                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
                                      <Calendar className="w-3 h-3" />
                                      {q.entry_date ? new Date(q.entry_date).toLocaleDateString('es-CL') : "-"}
                                    </span>
                                  </div>

                                  <p className="text-sm mb-2" style={{ color: 'var(--foreground)' }}>
                                    <strong>Descripción:</strong> {q.description}
                                  </p>

                                  <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" style={{ color: 'var(--stat-green-text)' }} />
                                    <span className="font-semibold" style={{ color: 'var(--stat-green-text)' }}>
                                      {formatPriceCLP(q.total_price)}
                                    </span>
                                  </div>
                                </div>

                                {selectedQuotation?.quotation_id === q.quotation_id && (
                                  <div className="ml-3">
                                    <CheckCircle className="w-5 h-5 text-purple-600" />
                                  </div>
                                )}
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
                          <p style={{ color: 'var(--muted-foreground)' }}>No hay cotizaciones para este vehículo</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Selected Quotation Details */}
                {selectedQuotation && (
                  <Card className="border shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-indigo-600" />
                        Detalles de la Cotización Seleccionada
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Basic quotation info */}
                      <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--stat-purple-bg)', borderColor: 'var(--stat-purple-text)' }}>
                        <div className="flex justify-between items-center mb-3">
                          <Badge variant="outline" className="text-lg font-bold">
                            Cotización #{selectedQuotation.quotation_id}
                          </Badge>
                          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            <Calendar className="w-4 h-4" />
                            {selectedQuotation.entry_date ? formatChileanDate(selectedQuotation.entry_date) : "-"}
                          </div>
                        </div>

                        <Separator className="my-3" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Descripción:</p>
                            <p style={{ color: 'var(--foreground)' }}>{selectedQuotation.description}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Estado:</p>
                            <Badge variant="outline">
                              {translateQuotationStatus(selectedQuotation.quotation_status)}
                            </Badge>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Total (incl. IVA):</p>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-5 h-5" style={{ color: 'var(--stat-green-text)' }} />
                              <span className="text-xl font-bold" style={{ color: 'var(--stat-green-text)' }}>
                                {formatPriceCLP(selectedQuotation.total_price)}
                              </span>
                            </div>
                          </div>
                          {selectedQuotation.vehicle?.mileage_history && (
                            <div className="md:col-span-2">
                              <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>Kilometraje Actual:</p>
                              <p style={{ color: 'var(--foreground)' }}>{latestMileage ?? "N/A"}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Product Details Table */}
                      {productDetails && productDetails.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Detalles de Productos</h3>
                          </div>

                          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                            <table className="min-w-full divide-y" style={{ backgroundColor: 'var(--card)' }}>
                              <thead style={{ backgroundColor: 'var(--card)' }}>
                                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                                    Producto
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                                    Descripción
                                  </th>
                                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                                    Precio Unitario
                                  </th>
                                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                                    Cantidad
                                  </th>
                                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                                    Mano de Obra
                                  </th>
                                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                                    Subtotal
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                {productDetails.map((detail, index) => {
                                  const subtotalDetail =
                                    Number(detail.sale_price) * detail.quantity +
                                    Number(detail.labor_price);
                                  return (
                                    <motion.tr
                                      key={detail.work_product_detail_id}
                                      className="transition-colors duration-150"
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.3, delay: index * 0.1 }}
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                                        {detail.product?.product_name || "N/A"}
                                      </td>
                                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                                        {detail.product?.description || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium" style={{ color: 'var(--foreground)' }}>
                                        {formatPriceCLP(Number(detail.sale_price))}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right" style={{ color: 'var(--foreground)' }}>
                                        {detail.quantity}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium" style={{ color: 'var(--foreground)' }}>
                                        {formatPriceCLP(Number(detail.labor_price))}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right" style={{ color: 'var(--foreground)' }}>
                                        {formatPriceCLP(subtotalDetail)}
                                      </td>
                                    </motion.tr>
                                  );
                                })}
                              </tbody>
                              <tfoot style={{ backgroundColor: 'var(--card)' }}>
                                <tr className="border-t-2" style={{ borderColor: 'var(--border)' }}>
                                  <td className="px-6 py-4 text-sm font-bold" style={{ color: 'var(--foreground)' }} colSpan={5}>
                                    Subtotal:
                                  </td>
                                  <td className="px-6 py-4 text-sm font-bold text-right" style={{ color: 'var(--foreground)' }}>
                                    {formatPriceCLP(subtotal)}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="px-6 py-4 text-sm font-bold" style={{ color: 'var(--foreground)' }} colSpan={5}>
                                    IVA ({taxRatePercent}%):
                                  </td>
                                  <td className="px-6 py-4 text-sm font-bold text-right" style={{ color: 'var(--foreground)' }}>
                                    {formatPriceCLP(taxAmount)}
                                  </td>
                                </tr>
                                <tr className="border-t" style={{ borderColor: 'var(--border)' }}>
                                  <td className="px-6 py-4 text-lg font-bold" style={{ color: 'var(--stat-green-text)' }} colSpan={5}>
                                    Total Final:
                                  </td>
                                  <td className="px-6 py-4 text-lg font-bold text-right" style={{ color: 'var(--stat-green-text)' }}>
                                    {formatPriceCLP(finalTotal)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Vehicle Information */}
                      {selectedQuotation.vehicle && (
                        <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                          <div className="flex items-center gap-2 mb-4">
                            <Car className="w-5 h-5" style={{ color: 'var(--stat-green-text)' }} />
                            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Información del Vehículo</h3>
                          </div>

                          <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--stat-green-bg)', borderColor: 'var(--balance-income-border)' }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Patente:</p>
                                <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{selectedQuotation.vehicle.license_plate}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Modelo:</p>
                                <p style={{ color: 'var(--foreground)' }}>{selectedQuotation.vehicle.model?.model_name}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Marca:</p>
                                <p style={{ color: 'var(--foreground)' }}>{selectedQuotation.vehicle.model?.brand?.brand_name}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Año:</p>
                                <p style={{ color: 'var(--foreground)' }}>{selectedQuotation.vehicle.year}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Color:</p>
                                <p style={{ color: 'var(--foreground)' }}>{selectedQuotation.vehicle.color}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Kilometraje Actual:</p>
                                <p style={{ color: 'var(--foreground)' }}>
                                  {latestMileage ? latestMileage.toLocaleString("es-CL") : "N/A"} Km
                                </p>
                              </div>
                              <div className="md:col-span-2 space-y-1">
                                <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Propietario / Empresa:</p>
                                <p style={{ color: 'var(--foreground)' }}>
                                  {selectedQuotation.vehicle.owner
                                    ? selectedQuotation.vehicle.owner.name
                                    : selectedQuotation.vehicle.company?.name}
                                </p>
                              </div>
                              {selectedQuotation.vehicle.mileage_history && selectedQuotation.vehicle.mileage_history.length > 0 && (
                                <div className="md:col-span-2 space-y-2">
                                  <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Historial de Kilometraje:</p>
                                  <div className="p-3 rounded border max-h-32 overflow-y-auto" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                                    <ul className="space-y-1">
                                      {selectedQuotation.vehicle.mileage_history.map((mileage) => (
                                        <li key={mileage.mileage_history_id} className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                                          <span className="font-medium">
                                            {formatChileanDate(mileage.registration_date)}:
                                          </span>{" "}
                                          {mileage.current_mileage.toLocaleString("es-CL")} km
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Work Order Description */}
                <Card className="border shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      Descripción de la Orden de Trabajo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ingrese una descripción detallada para la orden de trabajo..."
                      rows={4}
                      className="w-full min-h-[120px] resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    />
                  </CardContent>
                </Card>

                <motion.div
                  className="flex justify-end pt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Button
                    type="submit"
                    disabled={loading || !selectedQuotation}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Crear Orden de Trabajo
                      </div>
                    )}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default WorkOrderWithQuotation;
