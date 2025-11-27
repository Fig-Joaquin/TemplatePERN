import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronsUpDown,
  User,
  Building2,
  FileText,
  Search,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
            const qVehicleId = q.vehicle_id || q.vehicle?.vehicle_id;
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
            selectedQuotation.quotation_id!
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

        if (stockProduct?.stock_product_id !== undefined) {
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
    ? [...selectedQuotation.vehicle.mileage_history].sort(
      (a, b) => new Date(b.registration_date).getTime() - new Date(a.registration_date).getTime()
    )[0].current_mileage
    : null;

  return (
    <div className="space-y-6">
      {/* Filtro por Tipo de Propietario */}
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Filtro por Tipo de Propietario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={selectedType === "all" ? "default" : "outline"}
              onClick={() => setSelectedType("all")}
              type="button"
              size="sm"
              className="flex-1"
            >
              Todos
            </Button>
            <Button
              variant={selectedType === "person" ? "default" : "outline"}
              onClick={() => setSelectedType("person")}
              type="button"
              size="sm"
              className="flex-1"
            >
              <User className="w-4 h-4 mr-2" />
              Personas
            </Button>
            <Button
              variant={selectedType === "company" ? "default" : "outline"}
              onClick={() => setSelectedType("company")}
              type="button"
              size="sm"
              className="flex-1"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Empresas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selección de Vehículo */}
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Selección de Vehículo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={vehicleQuery}
              onChange={(e) => setVehicleQuery(e.target.value)}
              placeholder="Buscar vehículo por patente, marca, modelo o propietario..."
              className="w-full pl-10 pr-12 py-2.5 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Popover open={openVehiclePopover} onOpenChange={setOpenVehiclePopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                >
                  <ChevronsUpDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0" align="end">
                <ScrollArea className="h-80">
                  {filteredVehicles.length > 0 ? (
                    <div className="p-1">
                      {filteredVehicles.map((vehicle) => (
                        <button
                          key={vehicle.vehicle_id}
                          type="button"
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setOpenVehiclePopover(false);
                            setSelectedQuotation(null);
                          }}
                          className={cn(
                            "w-full text-left p-3 rounded-md transition-colors",
                            selectedVehicle?.vehicle_id === vehicle.vehicle_id
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-muted"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{vehicle.license_plate}</p>
                              <p className="text-xs text-muted-foreground">
                                {vehicle.model?.brand?.brand_name} {vehicle.model?.model_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {vehicle.owner ? vehicle.owner.name : vehicle.company?.name}
                              </p>
                            </div>
                            {selectedVehicle?.vehicle_id === vehicle.vehicle_id && (
                              <CheckCircle className="w-4 h-4 text-primary" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No se encontraron vehículos</p>
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {selectedVehicle && (
            <div className="mt-4 p-3 rounded-md border bg-muted/30">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-primary" />
                <div>
                  <p className="font-medium text-sm">
                    {selectedVehicle.license_plate} - {selectedVehicle.model?.brand?.brand_name}{" "}
                    {selectedVehicle.model?.model_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Propietario: {selectedVehicle.owner ? selectedVehicle.owner.name : selectedVehicle.company?.name}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Cotizaciones */}
      {selectedVehicle && (
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Cotizaciones Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            {vehicleQuotations.length > 0 ? (
              <div className="space-y-2">
                {vehicleQuotations.map((q) => (
                  <button
                    key={q.quotation_id}
                    type="button"
                    onClick={() => setSelectedQuotation(q)}
                    className={cn(
                      "w-full text-left p-4 rounded-md border transition-colors",
                      selectedQuotation?.quotation_id === q.quotation_id
                        ? "bg-primary/5 border-primary/40"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">#{q.quotation_id}</span>
                          <Badge variant="outline" className="text-xs">
                            {translateQuotationStatus(q.quotation_status)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {q.entry_date ? new Date(q.entry_date).toLocaleDateString('es-CL') : "-"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                          {q.description}
                        </p>
                        <p className="text-sm font-semibold">
                          {formatPriceCLP(q.total_price)}
                        </p>
                      </div>
                      {selectedQuotation?.quotation_id === q.quotation_id && (
                        <CheckCircle className="w-4 h-4 text-primary ml-3" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No hay cotizaciones para este vehículo</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detalles de la Cotización Seleccionada */}
      {selectedQuotation && (
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Detalles de la Cotización #{selectedQuotation.quotation_id}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Info básica */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-md bg-muted/30 border">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Estado</p>
                <Badge variant="outline">{translateQuotationStatus(selectedQuotation.quotation_status)}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Fecha</p>
                <p className="text-sm font-medium">{selectedQuotation.entry_date ? formatChileanDate(selectedQuotation.entry_date) : "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Kilometraje</p>
                <p className="text-sm font-medium">{latestMileage ? `${latestMileage.toLocaleString("es-CL")} km` : "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="text-sm font-semibold text-primary">{formatPriceCLP(selectedQuotation.total_price)}</p>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Descripción</p>
              <p className="text-sm">{selectedQuotation.description}</p>
            </div>

            {/* Tabla de productos */}
            {productDetails && productDetails.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-3">Productos ({productDetails.length})</p>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Producto</th>
                        <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Precio</th>
                        <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Cant.</th>
                        <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">M.O.</th>
                        <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {productDetails.map((detail) => {
                        const subtotalDetail = Number(detail.sale_price) * detail.quantity + Number(detail.labor_price);
                        return (
                          <tr key={detail.work_product_detail_id}>
                            <td className="px-4 py-2.5">
                              <p className="font-medium">{detail.product?.product_name || "N/A"}</p>
                              <p className="text-xs text-muted-foreground">{detail.product?.description || ""}</p>
                            </td>
                            <td className="px-4 py-2.5 text-right">{formatPriceCLP(Number(detail.sale_price))}</td>
                            <td className="px-4 py-2.5 text-center">{detail.quantity}</td>
                            <td className="px-4 py-2.5 text-right">{formatPriceCLP(Number(detail.labor_price))}</td>
                            <td className="px-4 py-2.5 text-right font-medium">{formatPriceCLP(subtotalDetail)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-muted/30">
                      <tr className="border-t">
                        <td colSpan={4} className="px-4 py-2 text-right text-sm">Subtotal:</td>
                        <td className="px-4 py-2 text-right font-medium">{formatPriceCLP(subtotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="px-4 py-2 text-right text-sm">IVA ({taxRatePercent}%):</td>
                        <td className="px-4 py-2 text-right font-medium">{formatPriceCLP(taxAmount)}</td>
                      </tr>
                      <tr className="border-t">
                        <td colSpan={4} className="px-4 py-2.5 text-right font-semibold">Total:</td>
                        <td className="px-4 py-2.5 text-right font-bold text-primary">{formatPriceCLP(finalTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Info del vehículo */}
            {selectedQuotation.vehicle && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">Información del Vehículo</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-md bg-muted/30 border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Patente</p>
                    <p className="text-sm font-medium">{selectedQuotation.vehicle.license_plate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Marca / Modelo</p>
                    <p className="text-sm">{selectedQuotation.vehicle.model?.brand?.brand_name} {selectedQuotation.vehicle.model?.model_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Año</p>
                    <p className="text-sm">{selectedQuotation.vehicle.year}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Color</p>
                    <p className="text-sm">{selectedQuotation.vehicle.color}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Propietario</p>
                    <p className="text-sm">
                      {selectedQuotation.vehicle.owner
                        ? selectedQuotation.vehicle.owner.name
                        : selectedQuotation.vehicle.company?.name}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Descripción de la Orden */}
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Descripción de la Orden</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción detallada del trabajo..."
            rows={3}
            className="resize-none"
          />
        </CardContent>
      </Card>

      {/* Botón de acción */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(-1)}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !selectedQuotation}
        >
          {loading ? "Creando..." : "Crear Orden de Trabajo"}
        </Button>
      </div>
    </div>
  );
};

export default WorkOrderWithQuotation;
