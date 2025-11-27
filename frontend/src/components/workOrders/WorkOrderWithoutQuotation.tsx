import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronsUpDown,
  Plus,
  User,
  Building2,
  Search,
  CheckCircle,
  X,
} from "lucide-react";

import { NumberInput } from "@/components/numberInput";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { fetchVehicles } from "../../services/vehicleService";
import { fetchProducts } from "../../services/productService";
import { getStockProducts, updateStockProduct } from "../../services/stockProductService";
import { createWorkOrder } from "../../services/workOrderService";
import { createWorkProductDetail } from "../../services/workProductDetail";
import { getActiveTax } from "@/services/taxService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SparePartsModal } from "@/components/quotations/SparePartsModal";
import { QuickProductCreateDialog } from "@/components/products/QuickProductCreateDialog";
import type { Vehicle, Product, StockProduct, WorkOrderInput, WorkProductDetail } from "../../types/interfaces";

interface SelectedProduct {
  productId: number;
  quantity: number;
  laborPrice: number;
}

interface WorkOrderWithoutQuotationProps {
  preselectedVehicleId?: number;
}

const WorkOrderWithoutQuotation = ({ preselectedVehicleId }: WorkOrderWithoutQuotationProps) => {
  const navigate = useNavigate();

  // Estados principales
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockProducts, setStockProducts] = useState<StockProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [activeTaxId, setActiveTaxId] = useState<number>(1);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(19);

  // Estados de UI
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [openVehiclePopover, setOpenVehiclePopover] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [selectedType, setSelectedType] = useState<"all" | "person" | "company">("all");

  // Función para generar descripción automática
  const generateAutoDescription = (vehicle: Vehicle): string => {
    const vehicleInfo = `${vehicle.model?.brand?.brand_name} ${vehicle.model?.model_name} - ${vehicle.license_plate}`.trim();

    if (vehicle.owner) {
      return `Orden de trabajo para ${vehicleInfo} del propietario ${vehicle.owner.name}`;
    } else if (vehicle.company) {
      return `Orden de trabajo para ${vehicleInfo} de la empresa ${vehicle.company.name}`;
    } else {
      return `Orden de trabajo para ${vehicleInfo}`;
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehiclesData = await fetchVehicles();
        setVehicles(vehiclesData);

        if (preselectedVehicleId) {
          const preselectedVehicle = vehiclesData.find(v => v.vehicle_id === preselectedVehicleId);
          if (preselectedVehicle) {
            setSelectedVehicle(preselectedVehicle);
          }
        }

        const productsData = await fetchProducts();
        setProducts(productsData);
        const stockData = await getStockProducts();
        setStockProducts(stockData);

        // Obtener el impuesto activo del sistema
        const tax = await getActiveTax();
        // Asegurar que tax_rate sea número (PostgreSQL puede devolverlo como string)
        const taxRateNum = Number(tax.tax_rate);
        setTaxRate(taxRateNum / 100);
        setActiveTaxId(tax.tax_id);
        setTaxRatePercent(taxRateNum);
      } catch (error: any) {
        console.error("Error al cargar datos iniciales:", error);
        toast.error(error.response?.data?.message || error.message || "Error al cargar datos iniciales");
      }
    };

    fetchData();
  }, [preselectedVehicleId]);

  // Actualizar descripción cuando se selecciona un vehículo
  useEffect(() => {
    if (selectedVehicle) {
      const autoDescription = generateAutoDescription(selectedVehicle);
      setDescription(autoDescription);
    }
  }, [selectedVehicle]);

  // Filtros y cálculos
  const filteredVehicles = vehicles.filter((vehicle) => {
    const vehicleInfo = [
      vehicle.license_plate,
      vehicle.model?.brand?.brand_name,
      vehicle.model?.model_name,
      vehicle.owner?.name,
      vehicle.company?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    let matchesType = true;
    if (selectedType === "person") {
      matchesType = !!vehicle.owner;
    } else if (selectedType === "company") {
      matchesType = !!vehicle.company;
    }

    return vehicleInfo.includes(vehicleQuery.toLowerCase()) && matchesType;
  });

  // Función para calcular precio con margen
  const calculateTotalWithMargin = (price: number, quantity: number, profitMargin: number): number => {
    return price * quantity * (1 + profitMargin / 100);
  };

  const totalProductPrice = selectedProducts.reduce((total, { productId, quantity }) => {
    const product = products.find((p) => p.product_id === productId);
    if (product) {
      return total + calculateTotalWithMargin(Number(product.sale_price), quantity, Number(product.profit_margin));
    }
    return total;
  }, 0);

  const totalLaborPrice = selectedProducts.reduce((total, { laborPrice }) => total + laborPrice, 0);
  const subtotalBeforeTax = totalProductPrice + totalLaborPrice;
  const taxAmount = Math.round(subtotalBeforeTax * taxRate);
  const finalTotal = subtotalBeforeTax + taxAmount;

  // Manejadores de eventos
  const handleProductChange = (productId: number, quantity: number, laborPrice: number) => {
    // Validar stock
    const stockProduct = stockProducts.find(sp => sp.product?.product_id === productId);
    const availableStock = stockProduct?.quantity || 0;

    if (quantity > availableStock) {
      toast.error(`Stock insuficiente. Disponible: ${availableStock}`);
      return;
    }

    const existingIndex = selectedProducts.findIndex(p => p.productId === productId);
    if (existingIndex >= 0) {
      const updated = [...selectedProducts];
      updated[existingIndex] = { productId, quantity, laborPrice };
      setSelectedProducts(updated);
    } else {
      setSelectedProducts([...selectedProducts, { productId, quantity, laborPrice }]);
    }
  };

  const handleRemoveProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    const updated = selectedProducts.map(p =>
      p.productId === productId ? { ...p, quantity } : p
    );
    setSelectedProducts(updated);
  };

  const handleLaborPriceChange = (productId: number, laborPrice: number) => {
    const updated = selectedProducts.map(p =>
      p.productId === productId ? { ...p, laborPrice } : p
    );
    setSelectedProducts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVehicle) {
      toast.error("Por favor selecciona un vehículo");
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error("Por favor selecciona al menos un producto");
      return;
    }

    setLoading(true);

    try {
      // Calcular subtotal sin IVA para la orden
      const subtotalWithoutTax = finalTotal / (1 + taxRate);
      const taxAmountCalc = finalTotal - subtotalWithoutTax;

      const workOrderData: WorkOrderInput = {
        vehicle_id: selectedVehicle.vehicle_id,
        description,
        order_status: "not_started",
        order_date: new Date().toISOString().split('T')[0],
        total_amount: finalTotal,
        // Guardar la tasa de IVA del momento de creación (asegurar que sea número)
        tax_rate: Number(taxRatePercent),
        subtotal: Math.trunc(subtotalWithoutTax),
        tax_amount: Math.trunc(taxAmountCalc),
      };

      const workOrderResponse = await createWorkOrder(workOrderData);
      const createdWorkOrder = workOrderResponse.workOrder;

      console.log("Orden de trabajo creada:", createdWorkOrder);
      console.log("work_order_id:", createdWorkOrder.work_order_id);

      if (!createdWorkOrder.work_order_id) {
        throw new Error("No se pudo obtener el ID de la orden de trabajo creada");
      }

      for (const selectedProduct of selectedProducts) {
        const product = products.find((p) => p.product_id === selectedProduct.productId);
        if (!product) continue;

        const profitMargin = Number(product.profit_margin);
        const finalProductPrice = Number(product.sale_price) * (1 + profitMargin / 100);

        const workProductDetailData: Omit<WorkProductDetail, 'work_product_detail_id'> = {
          work_order_id: createdWorkOrder.work_order_id,
          product_id: selectedProduct.productId,
          quantity: selectedProduct.quantity,
          sale_price: finalProductPrice,
          discount: 0,
          labor_price: selectedProduct.laborPrice,
          tax_id: activeTaxId, // Usar el ID del impuesto activo
          applied_tax_rate: taxRatePercent, // Guardar la tasa aplicada
        };

        console.log("Creando detalle de producto:", workProductDetailData);
        await createWorkProductDetail(workProductDetailData);

        // Update stock using correct property names
        const stockProduct = stockProducts.find(sp => sp.product?.product_id === selectedProduct.productId);
        if (stockProduct?.stock_product_id) {
          const newStock = Number(stockProduct.quantity) - selectedProduct.quantity;
          await updateStockProduct(stockProduct.stock_product_id.toString(), {
            quantity: newStock,
            updated_at: new Date()
          });
        }
      }

      toast.success("Orden de trabajo creada exitosamente");
      navigate("/admin/orden-trabajo");
    } catch (error: any) {
      console.error("Error al crear la orden de trabajo:", error);
      toast.error(`Error al crear la orden de trabajo: ${error.message || "Error desconocido"}`);
    } finally {
      setLoading(false);
    }
  };

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
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={vehicleQuery}
              onChange={(e) => setVehicleQuery(e.target.value)}
              placeholder="Buscar por patente o nombre..."
              className="w-full pl-10 pr-12 py-2.5 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Popover open={openVehiclePopover} onOpenChange={setOpenVehiclePopover}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2">
                  <ChevronsUpDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="end">
                <ScrollArea className="h-72">
                  {filteredVehicles.length > 0 ? (
                    <div className="p-1">
                      {filteredVehicles.map((vehicle) => (
                        <button
                          key={vehicle.vehicle_id}
                          type="button"
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setOpenVehiclePopover(false);
                            setVehicleQuery("");
                          }}
                          className="w-full p-3 text-left hover:bg-muted rounded-md transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{vehicle.license_plate}</p>
                              <p className="text-xs text-muted-foreground">
                                {vehicle.owner ? vehicle.owner.name : vehicle.company?.name || "Sin propietario"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {vehicle.model?.brand?.brand_name} {vehicle.model?.model_name}
                              </p>
                            </div>
                            <Badge variant={vehicle.vehicle_status === "running" ? "default" : "destructive"} className="text-xs">
                              {vehicle.vehicle_status === "running" ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No se encontraron vehículos
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {selectedVehicle && (
            <div className="p-3 rounded-md border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{selectedVehicle.license_plate}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedVehicle.owner ? selectedVehicle.owner.name : selectedVehicle.company?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedVehicle.model?.brand?.brand_name} {selectedVehicle.model?.model_name}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedVehicle(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sección de Productos */}
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Productos y Servicios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={() => setShowProductModal(true)} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Producto
            </Button>

            {selectedProducts.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Productos Seleccionados ({selectedProducts.length})</p>
                {selectedProducts.map(({ productId, quantity, laborPrice }) => {
                  const product = products.find(p => p.product_id === productId);
                  if (!product) return null;

                  const profitMargin = Number(product.profit_margin);
                  const finalPrice = Number(product.sale_price) * (1 + profitMargin / 100);
                  const stockProduct = stockProducts.find(sp => sp.product?.product_id === productId);

                  return (
                    <div key={productId} className="p-4 border rounded-md space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{product.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Stock: {stockProduct ? stockProduct.quantity : 0} | Precio: {formatPriceCLP(finalPrice)}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveProduct(productId)}>
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Cantidad</Label>
                          <NumberInput
                            value={quantity}
                            onChange={(value) => handleQuantityChange(productId, value)}
                            min={1}
                            max={stockProduct ? stockProduct.quantity : 1}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Mano de Obra</Label>
                          <NumberInput
                            value={laborPrice}
                            onChange={(value) => handleLaborPriceChange(productId, value)}
                            min={0}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Descripción */}
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Descripción del Trabajo</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe el trabajo a realizar..."
            rows={3}
            className="resize-none"
          />
        </CardContent>
      </Card>

      {/* Resumen de Costos */}
      {selectedProducts.length > 0 && (
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Resumen de Costos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal Productos:</span>
              <span>{formatPriceCLP(totalProductPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mano de Obra:</span>
              <span>{formatPriceCLP(totalLaborPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatPriceCLP(subtotalBeforeTax)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IVA ({Math.round(taxRate * 100)}%):</span>
              <span>{formatPriceCLP(taxAmount)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span className="text-primary">{formatPriceCLP(finalTotal)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones de Acción */}
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !selectedVehicle || selectedProducts.length === 0}>
          {loading ? "Creando..." : "Crear Orden de Trabajo"}
        </Button>
      </div>

      {/* Modal de Selección de Productos */}
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
        requireStock={true}
        title="Seleccionar Productos"
        description="Selecciona los productos para la orden de trabajo."
      />

      {/* Modal para crear producto rápido */}
      <QuickProductCreateDialog
        open={showCreateProductModal}
        onOpenChange={setShowCreateProductModal}
        onProductCreated={(newProduct) => {
          setProducts((prev) => [...prev, newProduct]);
          toast.success("Producto creado exitosamente");
        }}
      />
    </div>
  );
};

export default WorkOrderWithoutQuotation;
