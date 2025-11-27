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
  Package,
  Plus,
  Car,
  User,
  Building2,
  Calculator,
  Search,
  CheckCircle,
  X
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { motion, AnimatePresence } from "framer-motion";
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
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [tempSelectedProducts, setTempSelectedProducts] = useState<SelectedProduct[]>([]);

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
        toast.error(error.response?.data?.message || error.message || "Error al cargar datos iniciales");
      }
    };

    fetchData();
  }, [preselectedVehicleId]);

  // Filtros y cálculos
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesQuery = vehicle.license_plate.toLowerCase().includes(vehicleQuery.toLowerCase()) ||
      (vehicle.owner?.name || "").toLowerCase().includes(vehicleQuery.toLowerCase()) ||
      (vehicle.company?.name || "").toLowerCase().includes(vehicleQuery.toLowerCase());
    const matchesType = selectedTabIndex === 0 ? vehicle.owner !== null : vehicle.company !== null;
    return matchesQuery && matchesType;
  });

  // Función para calcular precio con margen (para SparePartsModal)
  const calculatePrice = (salePrice: number, quantity: number, profitMargin: number) => {
    const finalPrice = Number(salePrice) * (1 + Number(profitMargin) / 100);
    return finalPrice * quantity;
  };

  // Función para calcular precio con margen (para cálculos internos)
  const calculateTotalWithMargin = (product: Product, quantity: number) => {
    const profitMargin = Number(product.profit_margin);
    const finalPrice = Number(product.sale_price) * (1 + profitMargin / 100);
    return finalPrice * quantity;
  };

  const totalProductPrice = selectedProducts.reduce((total, { productId, quantity }) => {
    const product = products.find((p) => p.product_id === productId);
    return product ? total + calculateTotalWithMargin(product, quantity) : total;
  }, 0);

  const totalLaborPrice = selectedProducts.reduce((total, { laborPrice }) => total + laborPrice, 0);
  const subtotalBeforeTax = totalProductPrice + totalLaborPrice;
  const taxAmount = Math.round(subtotalBeforeTax * taxRate);
  const finalTotal = subtotalBeforeTax + taxAmount;

  // Manejadores de eventos
  const handleProductChange = (productId: number, quantity: number = 1, laborPrice: number = 0) => {
    // Validar stock disponible
    const stockProduct = stockProducts.find(sp => sp.product?.product_id === productId);
    const availableStock = stockProduct?.quantity || 0;
    
    if (quantity > availableStock) {
      toast.warning(`Solo hay ${availableStock} unidades disponibles en stock`);
      return;
    }
    
    const existingIndex = selectedProducts.findIndex(p => p.productId === productId);
    if (quantity === 0) {
      // Eliminar producto
      setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
    } else if (existingIndex >= 0) {
      // Actualizar producto existente
      const updated = [...selectedProducts];
      updated[existingIndex] = { productId, quantity, laborPrice: updated[existingIndex].laborPrice };
      setSelectedProducts(updated);
    } else {
      // Agregar nuevo producto
      setSelectedProducts([...selectedProducts, { productId, quantity, laborPrice }]);
    }
  };

  // Handler para abrir el modal
  const handleOpenProductModal = () => {
    setTempSelectedProducts([...selectedProducts]);
    setShowProductModal(true);
  };

  // Handler para cambios temporales en el modal
  const handleTempProductChange = (productId: number, quantity: number, laborPrice: number) => {
    const stockProduct = stockProducts.find(sp => sp.product?.product_id === productId);
    const availableStock = stockProduct?.quantity || 0;
    
    if (quantity > availableStock) {
      toast.warning(`Solo hay ${availableStock} unidades disponibles en stock`);
      return;
    }

    setTempSelectedProducts(prev => {
      const existingIndex = prev.findIndex(p => p.productId === productId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { productId, quantity, laborPrice };
        return updated;
      }
      return [...prev, { productId, quantity, laborPrice }];
    });
  };

  // Handler para eliminar producto temporal
  const handleTempRemoveProduct = (productId: number) => {
    setTempSelectedProducts(prev => prev.filter(p => p.productId !== productId));
  };

  // Handler para cerrar modal
  const handleModalClose = (save: boolean) => {
    if (save) {
      setSelectedProducts([...tempSelectedProducts]);
    }
    setShowProductModal(false);
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

      const workOrder = await createWorkOrder(workOrderData);

      for (const selectedProduct of selectedProducts) {
        const product = products.find((p) => p.product_id === selectedProduct.productId);
        if (!product) continue;

        const profitMargin = Number(product.profit_margin);
        const finalProductPrice = Number(product.sale_price) * (1 + profitMargin / 100);

        const workProductDetailData: Omit<WorkProductDetail, 'work_product_detail_id'> = {
          work_order_id: workOrder.work_order_id,
          product_id: selectedProduct.productId,
          quantity: selectedProduct.quantity,
          sale_price: finalProductPrice,
          discount: 0,
          labor_price: selectedProduct.laborPrice,
          tax_id: activeTaxId, // Usar el ID del impuesto activo
          applied_tax_rate: taxRatePercent, // Guardar la tasa aplicada
        };

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
      {/* Sección de Vehículo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600" />
            Seleccionar Vehículo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={selectedTabIndex.toString()} onValueChange={(value) => setSelectedTabIndex(Number(value))}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="0" className="flex items-center gap-2 transition-all duration-200 hover:shadow-md">
                <User className="w-4 h-4" />
                Personas
              </TabsTrigger>
              <TabsTrigger value="1" className="flex items-center gap-2 transition-all duration-200 hover:shadow-md">
                <Building2 className="w-4 h-4" />
                Empresas
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={vehicleQuery}
                onChange={(e) => setVehicleQuery(e.target.value)}
                placeholder="Buscar por patente o nombre..."
                className="w-full pl-10 pr-12 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Popover open={openVehiclePopover} onOpenChange={setOpenVehiclePopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="absolute right-1 top-1 hover:shadow-md transition-all duration-200">
                    <ChevronsUpDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <ScrollArea className="h-72">
                    {filteredVehicles.length > 0 ? (
                      filteredVehicles.map((vehicle) => (
                        <button
                          key={vehicle.vehicle_id}
                          type="button"
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setOpenVehiclePopover(false);
                            setVehicleQuery("");
                          }}
                          className="w-full p-3 text-left hover:bg-accent border-b border-border last:border-b-0 transition-all duration-200 hover:shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{vehicle.license_plate}</div>
                              <div className="text-sm text-muted-foreground">
                                {vehicle.owner ? vehicle.owner.name : vehicle.company?.name || "Sin propietario"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {vehicle.model?.brand?.brand_name} {vehicle.model?.model_name}
                              </div>
                            </div>
                            <Badge variant={vehicle.vehicle_status === "running" ? "default" : "destructive"}>
                              {vehicle.vehicle_status === "running" ? "Funcionando" : "Fuera de servicio"}
                            </Badge>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No se encontraron vehículos
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {selectedVehicle && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-accent/30 rounded-lg border"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium">{selectedVehicle.license_plate}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedVehicle.owner ? selectedVehicle.owner.name : selectedVehicle.company?.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedVehicle.model?.brand?.brand_name} {selectedVehicle.model?.model_name}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedVehicle(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Sección de Productos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            Productos y Servicios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={handleOpenProductModal} className="w-full hover:shadow-md transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Producto
            </Button>

            {selectedProducts.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Productos Seleccionados:</h4>
                <AnimatePresence>
                  {selectedProducts.map(({ productId, quantity, laborPrice }) => {
                    const product = products.find(p => p.product_id === productId);
                    if (!product) return null;

                    const profitMargin = Number(product.profit_margin);
                    const finalPrice = Number(product.sale_price) * (1 + profitMargin / 100);
                    const stockProduct = stockProducts.find(sp => sp.product?.product_id === productId);

                    return (
                      <motion.div
                        key={productId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="p-4 border border-border rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{product.product_name}</div>
                            <div className="text-sm text-muted-foreground">
                              Stock disponible: {stockProduct ? stockProduct.quantity : 0}
                            </div>
                            <div className="text-sm font-medium text-green-600">
                              Precio: {formatPriceCLP(finalPrice)}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveProduct(productId)}>
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Cantidad</Label>
                            <NumberInput
                              value={quantity}
                              onChange={(value) => handleQuantityChange(productId, value)}
                              min={1}
                              max={stockProduct ? stockProduct.quantity : 1}
                            />
                          </div>
                          <div>
                            <Label>Precio Mano de Obra</Label>
                            <NumberInput
                              value={laborPrice}
                              onChange={(value) => handleLaborPriceChange(productId, value)}
                              min={0}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Descripción */}
      <Card>
        <CardHeader>
          <CardTitle>Descripción del Trabajo</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe el trabajo a realizar..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Resumen de Costos */}
      {selectedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-green-600" />
              Resumen de Costos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal Productos:</span>
              <span>{formatPriceCLP(totalProductPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Mano de Obra:</span>
              <span>{formatPriceCLP(totalLaborPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatPriceCLP(subtotalBeforeTax)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>IVA ({Math.round(taxRate * 100)}%):</span>
              <span>{formatPriceCLP(taxAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span className="text-green-600">{formatPriceCLP(finalTotal)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones de Acción */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1 hover:shadow-md transition-all duration-200">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !selectedVehicle || selectedProducts.length === 0} className="flex-1 hover:shadow-md transition-all duration-200">
          {loading ? "Creando..." : "Crear Orden de Trabajo"}
        </Button>
      </div>

      {/* Modal de Selección de Productos */}
      <SparePartsModal
        open={showProductModal}
        onOpenChange={(open) => {
          if (!open) handleModalClose(false);
        }}
        products={products}
        stockProducts={stockProducts}
        selectedProducts={tempSelectedProducts}
        onProductChange={handleTempProductChange}
        onRemoveProduct={handleTempRemoveProduct}
        onConfirm={() => handleModalClose(true)}
        onCancel={() => handleModalClose(false)}
        onCreateProduct={() => setShowCreateProductModal(true)}
        calculatePrice={calculatePrice}
        showStock={true}
        requireStock={true}
        title="Agregar Productos"
        description="Selecciona los productos para la orden de trabajo"
      />

      {/* Dialog para crear producto rápido */}
      <QuickProductCreateDialog
        open={showCreateProductModal}
        onOpenChange={setShowCreateProductModal}
        onProductCreated={async () => {
          // Recargar productos y stock
          const productsData = await fetchProducts();
          setProducts(productsData);
          const stockData = await getStockProducts();
          setStockProducts(stockData);
        }}
      />
    </div>
  );
};

export default WorkOrderWithoutQuotation;
