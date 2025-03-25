import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronsUpDown, Package, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NumberInput } from "@/components/numberInput";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { fetchVehicles } from "../../services/vehicleService";
import { fetchProducts } from "../../services/productService";
import { getStockProducts, updateStockProduct } from "../../services/stockProductService";
import { createWorkOrder } from "../../services/workOrderService";
import { createWorkProductDetail } from "../../services/workProductDetail";
import { getTaxById } from "@/services/taxService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import type { Vehicle, Product, StockProduct, WorkOrderInput, WorkProductDetail } from "../../types/interfaces";

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
  const [products, setProducts] = useState<Product[]>([]);
  const [stockProducts, setStockProducts] = useState<StockProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [openVehiclePopover, setOpenVehiclePopover] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productQuery, setProductQuery] = useState("");

  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [taxRate, setTaxRate] = useState<number>(0);

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

        // Fetch tax rate
        const tax = await getTaxById(1); // IVA standard tax
        setTaxRate(tax.tax_rate / 100);
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
      const profitMargin = Number(product.profit_margin);
      const finalPrice = Number(product.sale_price) * (1 + profitMargin / 100);
      return total + finalPrice * quantity;
    }
    return total;
  }, 0);

  const totalLaborPrice = selectedProducts.reduce((total, { laborPrice }) => total + laborPrice, 0);

  // Calculate subtotal (products + labor), tax amount, and final total including tax
  const subtotalBeforeTax = totalProductPrice + totalLaborPrice;
  // Round the tax amount according to the rule (if decimals ≥ 0.5, round up; if < 0.5, round down)
  const taxAmount = Math.round(subtotalBeforeTax * taxRate);
  // Add the rounded tax amount to the subtotal to get the final total
  const totalFinal = subtotalBeforeTax + taxAmount;

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

  // Filtrado de productos según búsqueda
  const filteredProducts = products.filter(product => {
    const searchValue = productQuery.toLowerCase();
    return product.product_name.toLowerCase().includes(searchValue);
  });

  // Manejo de cambios en productos: cantidad y mano de obra.
  const handleProductChange = (productId: number, quantity: number, laborPrice: number) => {
    // Get the stock product to validate quantity
    const stockProduct = stockProducts.find(sp => sp.product?.product_id === productId);

    // Check if we have enough stock
    if (stockProduct && quantity > stockProduct.quantity) {
      toast.error(`Solo hay ${stockProduct.quantity} unidades disponibles de este producto`);
      quantity = stockProduct.quantity; // Limit to available stock
    }

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

    // Verify stock availability before submission
    const stockValidation = selectedProducts.every(({ productId, quantity }) => {
      const stockProduct = stockProducts.find(sp => sp.product?.product_id === productId);
      if (!stockProduct || stockProduct.quantity < quantity) {
        toast.error(`No hay suficiente stock para el producto ${products.find(p => p.product_id === productId)?.product_name}`);
        return false;
      }
      return true;
    });

    if (!stockValidation) return;

    setLoading(true);
    try {
      // 1. Crear la orden de trabajo
      const workOrderPayload: Partial<WorkOrderInput> = {
        vehicle_id: selectedVehicle.vehicle_id,
        description,
        work_order_status: "not_started", // Asegurarse que coincida con el enum en el backend
        total_amount: totalFinal, // Este valor ya incluye impuestos
        order_date: new Date().toISOString(), // Asegurar que se envía una fecha válida
      };

      console.log("Creating work order with payload:", workOrderPayload);
      const createdWorkOrderResponse = await createWorkOrder(workOrderPayload);
      console.log("Created Work Order Response:", createdWorkOrderResponse);

      // Corregir cómo accedemos al ID de la orden de trabajo
      const workOrderId = createdWorkOrderResponse.workOrder?.work_order_id;
      if (!workOrderId) {
        throw new Error("No se recibió un ID válido para la orden de trabajo");
      }

      // 2. Crear los detalles de producto vinculados a la orden (sin cotización)
      const workProductDetails: Partial<WorkProductDetail>[] = selectedProducts.map(
        ({ productId, quantity, laborPrice }) => {
          const product = products.find((p) => p.product_id === productId);
          const profitMargin = product ? Number(product.profit_margin) : 0;
          const finalPrice = product ? Number(product.sale_price) * (1 + profitMargin / 100) : 0;
          // Redondear a dos decimales:
          const finalPriceRounded = Math.round(finalPrice * 100) / 100;

          return {
            work_order_id: workOrderId,
            product_id: productId,
            quantity,
            labor_price: laborPrice,
            tax_id: 1, // Asumimos impuesto estándar
            sale_price: finalPriceRounded,
            discount: 0,
          };

        }
      );

      console.log("Creating work product details:", workProductDetails);

      // Crear los detalles uno por uno para evitar problemas de concurrencia
      for (const detail of workProductDetails) {
        await createWorkProductDetail(detail as WorkProductDetail);
      }

      // 3. Actualizar el stock de los productos
      const updatedStockProducts = selectedProducts.map(({ productId, quantity }) => {
        const stockProduct = stockProducts.find(sp => sp.product?.product_id === productId);
        return {
          ...stockProduct,
          quantity: stockProduct?.quantity ? stockProduct.quantity - quantity : 0,
        };
      });

      // Update stock for each product
      await Promise.all(updatedStockProducts.map(stockProduct => {
        if (stockProduct.stock_product_id !== undefined) {
          return updateStockProduct(stockProduct.stock_product_id.toString(), stockProduct);
        }
        return Promise.resolve(); // Skip if stock_product_id is undefined
      }));

      toast.success("Orden de trabajo creada sin cotización exitosamente");
      navigate("/admin/orden-trabajo");
    } catch (error: any) {
      console.error("Error al crear la orden de trabajo:", error);
      toast.error(`Error al crear la orden de trabajo: ${error.message || "Error desconocido"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Button
        onClick={() => window.location.reload()}
        variant="outline"
        className="mb-8"
      >
        Volver
      </Button>
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
          <div className="flex justify-between items-center">
            <Label className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Repuestos Seleccionados
            </Label>
            <Button
              type="button"
              onClick={() => setShowProductModal(true)}
              variant="outline"
              className="hover:accent hover:text-primary-foreground transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Añadir Repuesto
            </Button>
          </div>

          {/* Tarjeta de productos */}
          <Card className="bg-card shadow-sm">
            <CardContent className="p-4">
              <ScrollArea className="h-[300px] pr-4">
                <ul className="space-y-3">
                  {selectedProducts.map(({ productId, quantity, laborPrice }) => {
                    const product = products.find((p) => p.product_id === productId);
                    const stockProduct = stockProducts.find(
                      (sp) => sp.product?.product_id === productId
                    );
                    const basePrice = product ? Number(product.sale_price) : 0;
                    const profitMargin = product ? Number(product.profit_margin) : 0;
                    const finalPrice = basePrice * (1 + profitMargin / 100);
                    return (
                      <li
                        key={productId}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{product?.product_name}</p>
                          <p className="text-xs text-gray-500">Margen: {profitMargin}%</p>
                          <p className="text-sm text-muted-foreground">
                            Precio: {formatPriceCLP(basePrice)} - Stock: {stockProduct?.quantity}
                            {stockProduct && (
                              <span className="text-xs ml-1 text-green-600">
                                (Restante: {stockProduct.quantity - quantity})
                              </span>
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
                          <div className="flex flex-col items-end">
                            <span className="text-xs">Total</span>
                            <span className="font-medium">{formatPriceCLP(finalPrice * quantity + laborPrice)}</span>
                          </div>
                          <Button variant="destructive" size="sm" onClick={() => handleRemoveProduct(productId)}>
                            Eliminar
                          </Button>
                        </div>
                      </li>
                    );
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
                      <span>{formatPriceCLP(totalFinal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
              <CommandInput
                placeholder="Buscar repuestos..."
                className="h-9"
                value={productQuery}
                onValueChange={setProductQuery}
              />
              <CommandList>
                <CommandEmpty>No se encontraron repuestos.</CommandEmpty>
                <CommandGroup heading="Productos disponibles">
                  <ScrollArea className="h-[200px]">
                    {filteredProducts
                      .filter(product => {
                        // Find the stock for this product
                        const stockProduct = stockProducts.find(
                          sp => sp.product?.product_id === product.product_id
                        );
                        // Only include products with stock quantity > 0
                        return stockProduct && stockProduct.quantity > 0;
                      })
                      .map((product) => {
                        const stockProduct = stockProducts.find(
                          (sp) => sp.product?.product_id === product.product_id,
                        );
                        const selectedProduct = selectedProducts.find(
                          (sp) => sp.productId === product.product_id,
                        );
                        const isSelected = !!selectedProduct;

                        return (
                          <CommandItem
                            key={product.product_id}
                            className="flex items-center justify-between p-2 cursor-pointer hover:bg-accent/5"
                            onSelect={() => {
                              if (!isSelected) {
                                handleProductChange(product.product_id, 1, 0);
                              }
                            }}
                          >
                            <div className="flex items-center space-x-4 flex-1">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    handleProductChange(product.product_id, 1, 0);
                                  } else {
                                    handleRemoveProduct(product.product_id);
                                  }
                                }}
                              />
                              <div className="flex-1">
                                <p className="font-medium">{product.product_name}</p>
                                <p className="text-xs text-gray-500">Margen: {product.profit_margin}%</p>
                                <p className="text-sm text-muted-foreground">
                                  Precio: {formatPriceCLP(Number(product.sale_price))} - Stock:{" "}
                                  {stockProduct?.quantity || 0}
                                  {isSelected && stockProduct && (
                                    <span className="text-xs ml-1 text-green-600">
                                      (Restante: {stockProduct.quantity - (selectedProduct?.quantity || 0)})
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </CommandItem>
                        );
                      })}
                  </ScrollArea>
                </CommandGroup>

                {/* Unavailable products section */}
                <CommandGroup heading="Productos sin stock">
                  <ScrollArea className="h-[200px]">
                    {filteredProducts
                      .filter(product => {
                        // Find the stock for this product
                        const stockProduct = stockProducts.find(
                          sp => sp.product?.product_id === product.product_id
                        );
                        // Only include products with stock quantity = 0
                        return !stockProduct || stockProduct.quantity <= 0;
                      })
                      .map((product) => {
                        return (
                          <CommandItem
                            key={product.product_id}
                            className="flex items-center justify-between p-2 cursor-not-allowed opacity-50"
                            disabled={true}
                          >
                            <div className="flex items-center space-x-4 flex-1">
                              <Checkbox disabled checked={false} />
                              <div className="flex-1">
                                <p className="font-medium">{product.product_name}</p>
                                <p className="text-xs text-gray-500">Margen: {product.profit_margin}%</p>
                                <p className="text-sm text-muted-foreground">
                                  Precio: {formatPriceCLP(Number(product.sale_price))} - Stock: 0
                                </p>
                              </div>
                            </div>
                          </CommandItem>
                        );
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
    </div>
  );
};

export default WorkOrderWithoutQuotation;
