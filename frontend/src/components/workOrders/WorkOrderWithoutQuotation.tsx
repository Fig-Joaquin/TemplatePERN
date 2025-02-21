import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronsUpDown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NumberInput } from "@/components/numberInput";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { fetchVehicles } from "../../services/vehicleService";
import { fetchProducts } from "../../services/productService";
import { getStockProducts } from "../../services/stockProductService";
import { createWorkOrder } from "../../services/workOrderService";
import { createWorkProductDetail } from "../../services/workProductDetail";
import type { Vehicle, Product, StockProduct, WorkOrderInput, WorkProductDetail } from "../../types/interfaces";

// Eliminamos el campo "margin" en el SelectedProduct, ya que se usará el margen del producto
interface SelectedProduct {
  productId: number;
  quantity: number;
  laborPrice: number;
}

const WorkOrderWithoutQuotation = () => {
  const navigate = useNavigate();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [openVehiclePopover, setOpenVehiclePopover] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [stockProducts, setStockProducts] = useState<StockProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [openProductPopover, setOpenProductPopover] = useState(false);

  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Estado para el tab (0 = Personas, 1 = Empresas)
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  // Cargar vehículos, productos y stock
  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehiclesData = await fetchVehicles();
        setVehicles(vehiclesData);
        const productsData = await fetchProducts();
        setProducts(productsData);
        const stockData = await getStockProducts();
        setStockProducts(stockData);
      } catch (error) {
        toast.error("Error al cargar los datos iniciales");
      }
    };
    fetchData();
  }, []);

  // Calcular totales
  const totalProductPrice = selectedProducts.reduce((total, { productId, quantity }) => {
    const product = products.find((p) => p.product_id === productId);
    if (product) {
      // Se usa el margen que trae el producto (profit_margin)
      const profitMargin = Number(product.profit_margin);
      const finalPrice = Number(product.sale_price) * (1 + profitMargin / 100);
      return total + finalPrice * quantity;
    }
    return total;
  }, 0);

  const totalLaborPrice = selectedProducts.reduce((total, { laborPrice }) => total + laborPrice, 0);
  const totalFinal = totalProductPrice + totalLaborPrice;

  // Filtrado avanzado de vehículos según patente, teléfono o nombre (de dueño o empresa)
  const filteredVehicles = vehicles.filter((v) => {
    const searchValue = vehicleQuery.toLowerCase();
    const vehicleInfo = [
      v.license_plate,
      v.model?.brand?.brand_name,
      v.model?.model_name,
      v.owner?.name,
      v.owner?.number_phone,
      v.company?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesTab = selectedTabIndex === 0 ? !!v.owner : !!v.company;
    return vehicleInfo.includes(searchValue) && matchesTab;
  });

  // Manejo de cambios en productos: cantidad y mano de obra.
  const handleProductChange = (productId: number, quantity: number, laborPrice: number) => {
    setSelectedProducts((prev) => {
      const existing = prev.find((p) => p.productId === productId);
      if (existing) {
        return prev.map((p) =>
          p.productId === productId ? { ...p, quantity, laborPrice } : p
        );
      }
      return [...prev, { productId, quantity, laborPrice }];
    });
  };

  const handleRemoveProduct = (productId: number) => {
    setSelectedProducts((prev) => prev.filter((p) => p.productId !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !description) {
      toast.error("El vehículo y la descripción son obligatorios");
      return;
    }
    if (selectedProducts.length === 0) {
      toast.error("Debe agregar al menos un producto");
      return;
    }
    setLoading(true);
    try {
      // 1. Crear la orden de trabajo
      const workOrderPayload: Partial<WorkOrderInput> = {
        vehicle_id: selectedVehicle.vehicle_id,
        total_amount: totalFinal,
        description,
      };

      const createdWorkOrderResponse = await createWorkOrder(workOrderPayload);
      console.log("Created Work Order Response:", createdWorkOrderResponse);
      const workOrderId = createdWorkOrderResponse.workOrder?.work_order_id;
      if (!workOrderId) {
        throw new Error("No se recibió un ID válido para la orden de trabajo");
      }

      // 2. Crear los detalles de producto (sin cotización, omitiendo quotation_id)
      const workProductDetails: Partial<WorkProductDetail>[] = selectedProducts.map(
        ({ productId, quantity, laborPrice }) => {
          const product = products.find((p) => p.product_id === productId);
          // Se utiliza el profit_margin del producto
          const profitMargin = product ? Number(product.profit_margin) : 0;
          const finalPrice = product ? Number(product.sale_price) * (1 + profitMargin / 100) : 0;
          return {
            work_order_id: workOrderId,
            product_id: productId,
            quantity,
            labor_price: laborPrice,
            tax_id: 1, // Valor por defecto (ajustar si es necesario)
            sale_price: finalPrice,
            discount: 0,
          };
        }
      );

      console.log("Work Product Details:", workProductDetails);
      await Promise.all(workProductDetails.map((detail) => createWorkProductDetail(detail)));

      toast.success("Orden de trabajo creada sin cotización exitosamente");
      navigate("/admin/orden-trabajo");
    } catch (error: any) {
      console.error("Error al crear la orden de trabajo:", error);
      toast.error("Error al crear la orden de trabajo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Crear Orden de Trabajo sin Cotización</h2>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 shadow rounded">
        {/* SECCIÓN VEHÍCULO */}
        <div className="space-y-2">
          <Label>Vehículo</Label>
          <Tabs
            value={selectedTabIndex.toString()}
            onValueChange={(value) => setSelectedTabIndex(Number.parseInt(value))}
          >
            <TabsList className="grid w-full grid-cols-2 mb-2">
              <TabsTrigger value="0">Personas</TabsTrigger>
              <TabsTrigger value="1">Empresas</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative">
            <input
              type="text"
              value={vehicleQuery}
              onChange={(e) => setVehicleQuery(e.target.value)}
              placeholder="Buscar por patente, teléfono o nombre..."
              className="input input-bordered w-full"
            />
            <Popover open={openVehiclePopover} onOpenChange={setOpenVehiclePopover}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="absolute right-0 top-0">
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
                        }}
                        className="cursor-pointer p-2 hover:bg-gray-100 border-b"
                      >
                        {vehicle.license_plate} - {vehicle.model?.brand?.brand_name}{" "}
                        {vehicle.model?.model_name} -{" "}
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
            <div className="mt-2 p-2 border rounded bg-gray-50">
              <p className="font-medium">
                {selectedVehicle.license_plate} - {selectedVehicle.model?.brand?.brand_name}{" "}
                {selectedVehicle.model?.model_name}
              </p>
              <p>
                {selectedVehicle.owner
                  ? selectedVehicle.owner.name
                  : selectedVehicle.company?.name}
              </p>
            </div>
          )}
        </div>

        {/* SECCIÓN REPUESTOS */}
        <div className="space-y-2">
          <Label>Productos (Repuestos)</Label>
          <Popover open={openProductPopover} onOpenChange={setOpenProductPopover}>
            <PopoverTrigger asChild>
              <Button variant="outline">Añadir Producto</Button>
            </PopoverTrigger>
            <PopoverContent className="w-full">
              <ScrollArea className="h-72">
                {products.length > 0 ? (
                  products.map((product) => {
                    const stockProduct = stockProducts.find(
                      (sp) => sp.product?.product_id === product.product_id
                    );
                    return (
                      <div
                        key={product.product_id}
                        onClick={() => {
                          if (!selectedProducts.some((p) => p.productId === product.product_id)) {
                            handleProductChange(product.product_id, 1, 0); // Se asigna 1 unidad y 0 mano de obra; el margen se toma del producto
                          }
                          setOpenProductPopover(false);
                        }}
                        className="cursor-pointer p-2 hover:bg-gray-100 border-b"
                      >
                        {product.product_name} - Precio Base: {formatPriceCLP(Number(product.sale_price))} - Stock:{" "}
                        {stockProduct?.quantity}
                      </div>
                    );
                  })
                ) : (
                  <p className="p-2">No se encontraron productos.</p>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
          {/* Lista de productos seleccionados */}
          <div className="border rounded p-2">
            <ul>
              {selectedProducts.map(({ productId, quantity, laborPrice }) => {
                const product = products.find((p) => p.product_id === productId);
                const stockProduct = stockProducts.find((sp) => sp.product?.product_id === productId);
                const basePrice = product ? Number(product.sale_price) : 0;
                // Se usa el margen que trae el producto
                const profitMargin = product ? Number(product.profit_margin) : 0;
                const finalPrice = basePrice * (1 + profitMargin / 100);
                return (
                  <li key={productId} className="flex flex-col md:flex-row items-center justify-between border-b py-2">
                    <span className="flex-1">
                      {product?.product_name} -{" "}
                      <span className="text-sm text-gray-600">
                        Precio Base: {formatPriceCLP(basePrice)} | Margen: {profitMargin}% | Precio Final: {formatPriceCLP(finalPrice)}
                      </span>
                    </span>
                    <div className="flex space-x-2 mt-2 md:mt-0">
                      <div className="flex flex-col items-end">
                        <Label htmlFor={`quantity-${productId}`} className="text-xs">
                          Cantidad
                        </Label>
                        <NumberInput
                          id={`quantity-${productId}`}
                          value={quantity}
                          onChange={(value) => handleProductChange(productId, value, laborPrice)}
                          min={1}
                          max={stockProduct?.quantity}
                          className="w-20"
                        />
                      </div>
                      <div className="flex flex-col items-end">
                        <Label htmlFor={`labor-${productId}`} className="text-xs">
                          Mano de Obra
                        </Label>
                        <NumberInput
                          id={`labor-${productId}`}
                          value={laborPrice}
                          onChange={(value) => handleProductChange(productId, quantity, value)}
                          min={0}
                          className="w-24"
                          placeholder="Mano de Obra"
                          hideControls
                          isPrice
                        />
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => handleRemoveProduct(productId)}>
                        Eliminar
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          {/* Totales */}
          <div className="text-right space-y-1">
            <p>Total Productos: {formatPriceCLP(totalProductPrice)}</p>
            <p>Total Mano de Obra: {formatPriceCLP(totalLaborPrice)}</p>
            <p className="font-bold">Total Final: {formatPriceCLP(totalFinal)}</p>
          </div>
        </div>

        {/* Campo de descripción */}
        <div className="space-y-2">
          <Label>Descripción</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ingrese la descripción de la orden de trabajo"
            rows={4}
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Creando..." : "Crear Orden de Trabajo"}
        </Button>
      </form>
    </div>
  );
};

export default WorkOrderWithoutQuotation;
