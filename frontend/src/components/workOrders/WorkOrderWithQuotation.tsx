import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchVehicles } from "../../services/vehicleService";
import { fetchQuotations } from "../../services/quotationService";
import { createWorkOrder } from "../../services/workOrderService";
import { getWorkProductDetailsByQuotationId } from "../../services/workProductDetail";
import { getStockProducts, updateStockProduct } from "../../services/stockProductService";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { getTaxById } from "@/services/taxService";
import { getChileanISOString, formatChileanDate } from "@/utils/dateUtils";
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
      } catch (error) {
        toast.error("Error al cargar datos iniciales");
      }
    };
    
    fetchData();
  }, [preselectedVehicleId]);
  
  // Carga del tax rate
  useEffect(() => {
    const fetchTax = async () => {
      try {
        const res = await getTaxById(1);
        const tax = res.tax_rate / 100;
        setTaxRate(tax);
      } catch (error) {
        toast.error("Error al cargar impuesto");
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
        .catch(() => {
          toast.error("Error al cargar cotizaciones para el vehículo");
        });
    } else {
      setVehicleQuotations([]);
      setSelectedQuotation(null);
    }
  }, [selectedVehicle]);

  // Carga de detalle de productos para la cotización seleccionada
  useEffect(() => {
    if (selectedQuotation) {
      const fetchProductDetails = async () => {
        try {
          const details = await getWorkProductDetailsByQuotationId(
            selectedQuotation!.quotation_id!
          );
          setProductDetails(details);
        } catch (error) {
          toast.error("Error al cargar detalles de productos");
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
      const workOrderPayload: Partial<WorkOrderInput> = {
        vehicle_id: selectedVehicle.vehicle_id,
        quotation_id: selectedQuotation.quotation_id,
        total_amount: Math.trunc(finalTotal),
        description,
        order_date: getChileanISOString(), // Usar formato ISO con hora chilena preservada
      };

      console.log("Enviando orden con fecha chilena:", workOrderPayload.order_date);
      await createWorkOrder(workOrderPayload);

      // Update stock for each product in the quotation
      await updateProductStock();

      toast.success("Orden de trabajo creada exitosamente");
      navigate("/admin/orden-trabajo");
    } catch (error: any) {
      console.error("Error al crear la orden de trabajo:", error);
      toast.error("Error al crear la orden de trabajo");
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
          const updatedStock = {
            ...stockProduct,
            quantity: Math.max(0, stockProduct.quantity - detail.quantity)
          };

          // Update the stock in the database
          await updateStockProduct(stockProduct.stock_product_id.toString(), updatedStock);
          console.log(`Stock updated for product ID: ${detail.product_id}`);
        }
      }
    } catch (error) {
      console.error("Error updating product stock:", error);
      toast.error("Error al actualizar el inventario");
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const searchValue = vehicleQuery.toLowerCase();
    const vehicleInfo = [
      v.license_plate,
      v.model?.brand?.brand_name,
      v.model?.model_name,
      v.owner?.name,
      v.owner?.number_phone,
      v.company?.name,
      v.company?.phone,
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
    <div className="max-w-4xl mx-auto p-6">
      <Button
        onClick={() => window.location.reload()}
        variant="outline"
        className="mb-8"
      >
        Volver
      </Button>
      <h2 className="text-2xl font-bold mb-6 text-center">
        Crear Orden de Trabajo con Cotización
      </h2>
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 shadow rounded">
        {/* Filtro de tipo de vehículo según propietario */}
        <div className="flex gap-2 mb-2">
          <Button
            variant={selectedType === "all" ? "default" : "outline"}
            onClick={() => setSelectedType("all")}
            type="button"
          >
            Todos
          </Button>
          <Button
            variant={selectedType === "person" ? "default" : "outline"}
            onClick={() => setSelectedType("person")}
            type="button"
          >
            Personas
          </Button>
          <Button
            variant={selectedType === "company" ? "default" : "outline"}
            onClick={() => setSelectedType("company")}
            type="button"
          >
            Empresas
          </Button>
        </div>

        {/* Selección de vehículo */}
        <section>
          <Label className="mb-2 block">Vehículo</Label>
          <div className="relative">
            <input
              type="text"
              value={vehicleQuery}
              onChange={(e) => setVehicleQuery(e.target.value)}
              placeholder="Buscar vehículo..."
              className="input input-bordered w-full"
            />
            <Popover open={openVehiclePopover} onOpenChange={setOpenVehiclePopover}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <ChevronsUpDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full">
                <ScrollArea className="h-72">
                  {filteredVehicles.length > 0 ? (
                    filteredVehicles.map((vehicle) => (
                      <div
                        key={vehicle.vehicle_id}
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setOpenVehiclePopover(false);
                          setSelectedQuotation(null); // Reinicia la cotización al cambiar vehículo
                        }}
                        className={cn("cursor-pointer p-2 hover:bg-gray-100 border-b", {
                          "bg-blue-50": selectedVehicle?.vehicle_id === vehicle.vehicle_id,
                        })}
                      >
                        {vehicle.license_plate} - {vehicle.model?.brand?.brand_name} {vehicle.model?.model_name} -{" "}
                        {vehicle.owner ? vehicle.owner.name : vehicle.company?.name}
                      </div>
                    ))
                  ) : (
                    <p className="p-2 text-center text-gray-500">No se encontró vehículo.</p>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
          {selectedVehicle && (
            <div className="mt-3 p-4 border rounded bg-gray-50">
              <p className="font-medium">
                {selectedVehicle.license_plate} - {selectedVehicle.model?.brand?.brand_name}{" "}
                {selectedVehicle.model?.model_name}
              </p>
              <p className="text-sm text-gray-700">
                {selectedVehicle.owner ? selectedVehicle.owner.name : selectedVehicle.company?.name}
              </p>
            </div>
          )}
        </section>

        {/* Lista de cotizaciones */}
        {selectedVehicle && (
          <section>
            <Label className="mb-2 block">Cotizaciones disponibles para este vehículo</Label>
            {vehicleQuotations.length > 0 ? (
              <div className="border p-4 rounded space-y-4">
                {vehicleQuotations.map((q) => (
                  <div
                    key={q.quotation_id}
                    onClick={() => setSelectedQuotation(q)}
                    className={cn("cursor-pointer p-4 border rounded hover:bg-gray-100", {
                      "bg-blue-50 border-blue-400": selectedQuotation?.quotation_id === q.quotation_id,
                    })}
                  >
                    <div className="flex justify-between">
                      <span className="font-semibold">ID: {q.quotation_id}</span>
                      <span className="text-sm text-gray-600">
                        {q.entry_date ? new Date(q.entry_date).toLocaleDateString() : "-"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">
                      <strong>Descripción:</strong> {q.description}
                    </p>
                    <p className="mt-1 text-sm">
                      <strong>Estado:</strong> {q.quotation_status}
                    </p>
                    <p className="mt-1 text-sm">
                      <strong>Total:</strong> {formatPriceCLP(q.total_price)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No hay cotizaciones para este vehículo.</p>
            )}
          </section>
        )}

        {/* Detalle de la cotización seleccionada */}
        {selectedQuotation && (
          <section>
            <Label className="mb-2 block">Detalles de la Cotización Seleccionada</Label>
            <div className="border p-4 rounded shadow-sm bg-gray-50 space-y-4">
              {/* Datos básicos de la cotización */}
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Cotización #{selectedQuotation.quotation_id}</span>
                <span className="text-sm text-gray-600">
                  {selectedQuotation.entry_date ? formatChileanDate(selectedQuotation.entry_date) : "-"}
                </span>
              </div>
              <div>
                <p>
                  <strong>Descripción:</strong> {selectedQuotation.description}
                </p>
                <p>
                  <strong>Estado:</strong> {selectedQuotation.quotation_status}
                </p>
                {/* Ahora el total final de la cotización se muestra con tax */}
                <p>
                  <strong>Total (incl. IVA):</strong> {formatPriceCLP(selectedQuotation.total_price)}
                </p>
                {selectedQuotation.vehicle && selectedQuotation.vehicle.mileage_history && (
                  <p>
                    <strong>Kilometraje Actual:</strong> {latestMileage ? latestMileage : "N/A"}
                  </p>
                )}
              </div>

              {/* Tabla de detalle de productos */}
              {productDetails && productDetails.length > 0 && (
                <div>
                  <Label className="block mb-2">Detalles de Productos</Label>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border px-4 py-2 text-left">Producto</th>
                          <th className="border px-4 py-2 text-left">Descripción</th>
                          <th className="border px-4 py-2 text-right">Precio Unitario</th>
                          <th className="border px-4 py-2 text-right">Cantidad</th>
                          <th className="border px-4 py-2 text-right">Mano de Obra</th>
                          <th className="border px-4 py-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productDetails.map((detail) => {
                          const subtotalDetail =
                            Number(detail.sale_price) * detail.quantity +
                            Number(detail.labor_price);
                          return (
                            <tr key={detail.work_product_detail_id} className="hover:bg-gray-50">
                              <td className="border px-4 py-2">{detail.product?.product_name || "N/A"}</td>
                              <td className="border px-4 py-2">{detail.product?.description || "-"}</td>
                              <td className="border px-4 py-2 text-right">
                                {formatPriceCLP(Number(detail.sale_price))}
                              </td>
                              <td className="border px-4 py-2 text-right">{detail.quantity}</td>
                              <td className="border px-4 py-2 text-right">
                                {formatPriceCLP(Number(detail.labor_price))}
                              </td>
                              <td className="border px-4 py-2 text-right">
                                {formatPriceCLP(subtotalDetail)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100">
                          <td className="border px-4 py-2 font-bold" colSpan={5}>
                            Subtotal:
                          </td>
                          <td className="border px-4 py-2 text-right font-bold">
                            {formatPriceCLP(subtotal)}
                          </td>
                        </tr>
                        <tr className="bg-gray-100">
                          <td className="border px-4 py-2 font-bold" colSpan={5}>
                            IVA (19%):
                          </td>
                          <td className="border px-4 py-2 text-right font-bold">
                            {formatPriceCLP(taxAmount)}
                          </td>
                        </tr>
                        <tr className="bg-gray-100">
                          <td className="border px-4 py-2 font-bold" colSpan={5}>
                            Total Final:
                          </td>
                          <td className="border px-4 py-2 text-right font-bold">
                            {formatPriceCLP(finalTotal)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Información extendida del vehículo */}
              {selectedQuotation.vehicle && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Información del Vehículo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="block">Patente:</Label>
                      <p>{selectedQuotation.vehicle.license_plate}</p>
                    </div>
                    <div>
                      <Label className="block">Modelo:</Label>
                      <p>{selectedQuotation.vehicle.model?.model_name}</p>
                    </div>
                    <div>
                      <Label className="block">Marca:</Label>
                      <p>{selectedQuotation.vehicle.model?.brand?.brand_name}</p>
                    </div>
                    <div>
                      <Label className="block">Año:</Label>
                      <p>{selectedQuotation.vehicle.year}</p>
                    </div>
                    <div>
                      <Label className="block">Color:</Label>
                      <p>{selectedQuotation.vehicle.color}</p>
                    </div>
                    <div>
                      <Label className="block">Kilometraje Actual:</Label>
                      <p>{latestMileage ? latestMileage.toLocaleString("es-CL") : "N/A"} Km</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="block">Propietario / Empresa:</Label>
                      <p>
                        {selectedQuotation.vehicle.owner
                          ? selectedQuotation.vehicle.owner.name
                          : selectedQuotation.vehicle.company?.name}
                      </p>
                    </div>
                    {selectedQuotation.vehicle.mileage_history && selectedQuotation.vehicle.mileage_history.length > 0 && (
                      <div className="col-span-2">
                        <Label className="block">Historial de Kilometraje:</Label>
                        <ul className="list-disc list-inside">
                          {selectedQuotation.vehicle.mileage_history.map((mileage) => (
                            <li key={mileage.mileage_history_id}>
                              {formatChileanDate(mileage.registration_date)}: {mileage.current_mileage.toLocaleString("es-CL")} km
                            </li>

                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Campo de descripción para la orden de trabajo */}
        <section>
          <Label className="mb-2 block">Descripción</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ingrese la descripción de la orden de trabajo"
            rows={4}
            className="w-full"
          />
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="px-6 py-2">
            {loading ? "Creando..." : "Crear Orden de Trabajo"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default WorkOrderWithQuotation;
