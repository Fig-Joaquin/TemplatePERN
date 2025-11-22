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
  ShoppingCart,
  Calculator,
  Search,
  AlertCircle,
  CheckCircle,
  X,
  FileText
} from "lucide-react";

import { NumberInput } from "@/components/numberInput";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { fetchVehicles } from "../../services/vehicleService";
import { fetchProducts } from "../../services/productService";
import { getStockProducts, updateStockProduct } from "../../services/stockProductService";
import { createWorkOrder } from "../../services/workOrderService";
import { createWorkProductDetail } from "../../services/workProductDetail";
import { getTaxById } from "@/services/taxService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
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

  // Estados de UI
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [openVehiclePopover, setOpenVehiclePopover] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
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

        const tax = await getTaxById(1);
        setTaxRate(tax.tax_rate / 100);
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

  const filteredProducts = products.filter((product) =>
    product.product_name.toLowerCase().includes(productQuery.toLowerCase()) ||
    (product.description || "").toLowerCase().includes(productQuery.toLowerCase())
  );

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
  const subtotalBeforeTax = totalProductPrice + totalLaborPrice;
  const taxAmount = Math.round(subtotalBeforeTax * taxRate);
  const finalTotal = subtotalBeforeTax + taxAmount;

  // Manejadores de eventos
  const handleProductSelect = (productId: number, quantity: number = 1, laborPrice: number = 0) => {
    const existingIndex = selectedProducts.findIndex(p => p.productId === productId);
    if (existingIndex >= 0) {
      const updated = [...selectedProducts];
      updated[existingIndex] = { productId, quantity, laborPrice };
      setSelectedProducts(updated);
    } else {
      setSelectedProducts([...selectedProducts, { productId, quantity, laborPrice }]);
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
      const workOrderData: WorkOrderInput = {
        vehicle_id: selectedVehicle.vehicle_id,
        description,
        order_status: "not_started",
        order_date: new Date().toISOString().split('T')[0], // Convert to string format
        total_amount: finalTotal,
      };

      const workOrderResponse = await createWorkOrder(workOrderData);
      const createdWorkOrder = workOrderResponse.workOrder; // Extract the actual work order from the response

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
          sale_price: finalProductPrice, // Use sale_price instead of unit_price
          discount: 0,
          labor_price: selectedProduct.laborPrice,
          tax_id: 1,
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
      {/* Sección de Vehículo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600" />
            Seleccionar Vehículo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtro por Tipo de Propietario */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Filtro por Tipo de Propietario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button
                  variant={selectedType === "all" ? "default" : "outline"}
                  onClick={() => setSelectedType("all")}
                  type="button"
                  className="flex-1 transition-all duration-200 hover:shadow-md"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Todos
                </Button>
                <Button
                  variant={selectedType === "person" ? "default" : "outline"}
                  onClick={() => setSelectedType("person")}
                  type="button"
                  className="flex-1 transition-all duration-200 hover:shadow-md"
                >
                  <User className="w-4 h-4 mr-2" />
                  Personas
                </Button>
                <Button
                  variant={selectedType === "company" ? "default" : "outline"}
                  onClick={() => setSelectedType("company")}
                  type="button"
                  className="flex-1 transition-all duration-200 hover:shadow-md"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Empresas
                </Button>
              </div>
            </CardContent>
          </Card>

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
                <Button variant="ghost" size="sm" onClick={() => setSelectedVehicle(null)} className="hover:shadow-md transition-all duration-200">
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
            <Button onClick={() => setShowProductModal(true)} className="w-full hover:shadow-md transition-all duration-200">
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
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveProduct(productId)} className="hover:shadow-md transition-all duration-200">
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
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Seleccionar Productos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full pl-10 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredProducts.map((product) => {
                  const stockProduct = stockProducts.find(sp => sp.product?.product_id === product.product_id);
                  const inStock = stockProduct && stockProduct.quantity > 0;
                  const profitMargin = Number(product.profit_margin);
                  const finalPrice = Number(product.sale_price) * (1 + profitMargin / 100);
                  const isSelected = selectedProducts.some(p => p.productId === product.product_id);

                  // Define className based on state
                  let cardClassName = "w-full text-left p-3 border border-border rounded-lg transition-all duration-200 ";
                  if (isSelected) {
                    cardClassName += "bg-primary/10 border-primary";
                  } else if (inStock) {
                    cardClassName += "hover:bg-accent hover:shadow-md";
                  } else {
                    cardClassName += "opacity-50";
                  }

                  // Define badge content
                  let badgeContent;
                  if (isSelected) {
                    badgeContent = <CheckCircle className="w-5 h-5 text-green-600" />;
                  } else if (inStock) {
                    badgeContent = (
                      <Badge variant="outline">
                        Stock: {stockProduct?.quantity}
                      </Badge>
                    );
                  } else {
                    badgeContent = (
                      <Badge variant="destructive">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Sin stock
                      </Badge>
                    );
                  }

                  return (
                    <button
                      key={product.product_id}
                      type="button"
                      className={cardClassName}
                      onClick={() => inStock && !isSelected && handleProductSelect(product.product_id)}
                      disabled={!inStock || isSelected}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{product.product_name}</div>
                          {product.description && (
                            <div className="text-sm text-muted-foreground">{product.description}</div>
                          )}
                          <div className="text-sm font-medium text-green-600">
                            {formatPriceCLP(finalPrice)}
                          </div>
                        </div>
                        <div className="text-right">
                          {badgeContent}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    No se encontraron productos
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkOrderWithoutQuotation;
