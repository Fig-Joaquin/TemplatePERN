import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createWorkProductDetail,
  updateWorkProductDetail,
  deleteWorkProductDetail,
  getWorkProductDetailsByQuotationId,
} from "@/services/workProductDetail";
import { getCompleteWorkOrderById, updateWorkOrder } from "@/services/workOrderService";
import { fetchProducts } from "@/services/productService";
// Se incluye updateStockProduct para modificar el stock
import { getStockProducts, updateStockProduct } from "@/services/stockProductService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox"; // Added Checkbox import
import {
  ArrowLeft,
  Save,
  Car,
  Wrench,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  Info,
  User,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { formatDate } from "@/utils/formDate";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchPersonsEmployee } from "@/services/personService";
import {
  createWorkOrderTechnician,
  getWorkOrderTechnicians,
  deleteWorkOrderTechnician,
} from "@/services/workOrderTechnicianService";
import { Person, WorkOrderTechnician } from "@/types/interfaces";

const WorkOrderEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<any>(null);
  const [description, setDescription] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [stockProducts, setStockProducts] = useState<any[]>([]);
  const [status, setStatus] = useState<string>("not_started");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [productQuantity, setProductQuantity] = useState<number>(1);
  const [productLaborPrice, setProductLaborPrice] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0.19);
  // Para distinguir órdenes basadas en cotización
  const [isQuotationBased, setIsQuotationBased] = useState<boolean>(false);
  const [quotationProducts, setQuotationProducts] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<Person[]>([]);
  const [assignedTechnicians, setAssignedTechnicians] = useState<WorkOrderTechnician[]>([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(null);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [tempProducts, setTempProducts] = useState<any[]>([]); // Add temporary products state
  const [productsToDelete, setProductsToDelete] = useState<number[]>([]); // Track products to delete

  useEffect(() => {
    const loadData = async () => {
      try {
        const productsData = await fetchProducts();
        setAllProducts(productsData);

        // Cargar stock
        const stockData = await getStockProducts();
        setStockProducts(stockData);

        await loadWorkOrder();
      } catch (err) {
        console.error("Error loading data:", err);
        toast.error("Error al cargar la información");
      }
    };

    loadData();
  }, []);

  const loadWorkOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCompleteWorkOrderById(Number(id));
      console.log("Loaded work order data:", data);
      setOrderData(data);
      setDescription(data.description || "");

      // Determinar si la orden se basa en una cotización
      const hasQuotation = !!data.quotation?.quotation_id;
      setIsQuotationBased(hasQuotation);

      if (data.productDetails && data.productDetails.length > 0) {
        // Agregar originalQuantity para seguimiento
        const enhancedProducts = data.productDetails.map((product: any) => ({
          ...product,
          originalQuantity: product.quantity,
        }));
        setProducts(enhancedProducts);
      }

      if (hasQuotation && data.quotation) {
        try {
          const quotationDetails = await getWorkProductDetailsByQuotationId(data.quotation.quotation_id);
          setQuotationProducts(quotationDetails || []);
        } catch (detailError) {
          console.error("Error loading quotation details:", detailError);
        }
      }
      setStatus(data.order_status || "not_started");
    } catch (err) {
      console.error("Error loading work order:", err);
      setError("No se pudo cargar la información de la orden de trabajo");
      toast.error("Error al cargar la orden de trabajo");
    } finally {
      setLoading(false);
    }
  };

  // Modified to use temp products state
  const handleAddProduct = () => {
    setTempProducts([...products]); // Initialize temp products with current products
    setShowProductModal(true);
    setSelectedProductId(null);
    setProductQuantity(1);
    setProductLaborPrice(0);
  };

  // Handle product selection in modal
  const handleTempProductChange = (productId: number, quantity: number, laborPrice: number = 0) => {
    const selectedProduct = allProducts.find(p => p.product_id === productId);
    if (!selectedProduct) return;

    // Only validate stock for products not already in the order
    const isNewProduct = !products.some(p => p.product_id === productId);

    const stockProduct = stockProducts.find(sp => sp.product?.product_id === productId);
    const availableStock = stockProduct ? stockProduct.quantity : 0;

    // Validate stock only for new products
    if (isNewProduct && quantity > availableStock) {
      toast.error(`No hay suficiente stock para ${selectedProduct.product_name}. Disponible: ${availableStock}`);
      return;
    }

    // Calculate price with margin
    const basePrice = Number(selectedProduct.sale_price);
    const margin = Number(selectedProduct.profit_margin) / 100;
    const priceWithMargin = Number((basePrice * (1 + margin)).toFixed(2));

    setTempProducts(prev => {
      const existingIndex = prev.findIndex(p => p.product_id === productId);
      if (existingIndex >= 0) {
        // Update existing product
        return prev.map((p, i) =>
          i === existingIndex
            ? { ...p, quantity, labor_price: laborPrice, _temp: true }
            : p
        );
      } else {
        // Add new product
        return [...prev, {
          product_id: productId,
          product: selectedProduct,
          quantity,
          sale_price: priceWithMargin,
          labor_price: laborPrice,
          _temp: true,
          _isNew: true
        }];
      }
    });
  };

  // Remove product from temp state
  const handleTempRemoveProduct = (productId: number) => {
    setTempProducts(prev => prev.filter(p => p.product_id !== productId));
  };

  // Apply temporary changes to main state
  const handleModalClose = (save: boolean) => {
    if (save) {
      // Only validate NEW products that aren't already in the order
      const newTempProducts = tempProducts.filter(p => p._temp && p._isNew);

      const hasInvalidQuantity = newTempProducts.some(product => {
        const stockProduct = stockProducts.find(sp => sp.product?.product_id === product.product_id);
        const availableStock = stockProduct ? stockProduct.quantity : 0;
        return product.quantity > availableStock;
      });

      if (hasInvalidQuantity) {
        toast.error("Uno o más productos nuevos exceden el stock disponible");
        return;
      }

      setProducts(tempProducts);
    }

    setShowProductModal(false);
  };

  // Modified to only mark products for deletion
  const handleRemoveProduct = (index: number) => {
    const productToRemove = products[index];

    if (productToRemove.work_product_detail_id) {
      // Add to list of products to delete on save
      setProductsToDelete(prev => [...prev, productToRemove.work_product_detail_id]);
    }

    // Remove from current list without updating stock yet
    setProducts(prev => prev.filter((_, i) => i !== index));
  };

  // Add this function to handle quantity changes in the product table
  const handleProductQuantityChange = (index: number, newQuantity: number) => {
    setProducts(prev => {
      const updated = [...prev];

      // Get the current product
      const product = updated[index];

      // Find the stock for this product
      const stockProduct = stockProducts.find(sp => sp.product?.product_id === product.product_id);
      const availableStock = stockProduct ? stockProduct.quantity : 0;

      // For existing products, we need to consider their original quantity
      // which was already taken from the stock
      if (!product._isNew && product.originalQuantity !== undefined) {
        // Calculate how many additional units we can take
        // availableStock + originalQuantity = total available for this product
        const maxAllowed = availableStock + product.originalQuantity;

        if (newQuantity > maxAllowed) {
          toast.error(`No puede exceder el stock disponible más el original (${maxAllowed})`);
          return prev;
        }
      } else if (product._isNew && newQuantity > availableStock) {
        // For new products, we simply check against the available stock
        toast.error(`No puede exceder el stock disponible (${availableStock})`);
        return prev;
      }

      // Update the quantity and mark as modified
      updated[index] = {
        ...product,
        quantity: newQuantity,
        _modified: true
      };

      return updated;
    });
  };

  // Also modify the handler for labor price to mark products as modified
  const handleProductLaborPriceChange = (index: number, newLaborPrice: number) => {
    setProducts(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        labor_price: newLaborPrice,
        _modified: true
      };
      return updated;
    });
  };

  // Submit: Actualiza la orden y procesa cada detalle
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !orderData) return;

    // Validar que cada detalle no exceda el stock actual, considerando su cantidad original
    for (const product of products) {
      // Skip products that will be deleted
      if (productsToDelete.includes(product.work_product_detail_id)) continue;

      const stockProduct = stockProducts.find(sp => sp.product?.product_id === product.product_id);
      if (!stockProduct) continue;

      const availableStock = stockProduct.quantity;

      // For existing products, only check the additional quantity
      if (!product._isNew && product.originalQuantity !== undefined) {
        // If the new quantity is less than or equal to the original, it's always valid
        // since we're just returning items to stock
        if (product.quantity <= product.originalQuantity) continue;

        // Otherwise, check if we have enough stock for the additional quantity
        const additionalQuantity = product.quantity - product.originalQuantity;
        if (additionalQuantity > availableStock) {
          const productName = product.product?.product_name ||
            allProducts.find(p => p.product_id === product.product_id)?.product_name ||
            "seleccionado";
          toast.error(`No hay suficiente stock para el producto ${productName}. 
                      Puede aumentar máximo en ${availableStock} unidades.`);
          return;
        }
      } else if (product._isNew && product.quantity > availableStock) {
        // For new products, validate the full quantity
        const productName = product.product?.product_name ||
          allProducts.find(p => p.product_id === product.product_id)?.product_name ||
          "seleccionado";
        toast.error(`No hay suficiente stock para el producto ${productName}. Máximo: ${availableStock}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await updateWorkOrder(Number(id), {
        description,
        order_status: status,
        total_amount: totalAmount,
      });

      // Process deletions first
      for (const detailId of productsToDelete) {
        const productToRemove = orderData.productDetails.find(p => p.work_product_detail_id === detailId);

        if (productToRemove) {
          await deleteWorkProductDetail(detailId);

          // Return quantity to stock
          const stockProduct = stockProducts.find(sp => sp.product?.product_id === productToRemove.product_id);
          if (stockProduct && stockProduct.stock_product_id) {
            // Fix: Ensure quantity is properly parsed as a number and avoid potential type conversion issues
            const removedQuantity = parseInt(productToRemove.quantity.toString(), 10);
            const currentStock = parseInt(stockProduct.quantity.toString(), 10);
            const updatedQuantity = currentStock + removedQuantity;

            console.log(`Returning ${removedQuantity} units to stock. Before: ${currentStock}, After: ${updatedQuantity}`);

            await updateStockProduct(stockProduct.stock_product_id.toString(), {
              ...stockProduct,
              quantity: updatedQuantity,
            });
          }
        }
      }

      // Process each product: update if modified, create if new
      for (const product of products) {
        // Skip deleted products
        if (productsToDelete.includes(product.work_product_detail_id)) continue;

        const detailPayload = {
          product_id: product.product_id,
          quantity: Number(product.quantity),
          sale_price: Number(Number(product.sale_price).toFixed(2)),
          labor_price: Number(Number(product.labor_price).toFixed(2)),
          discount: product.discount || 0,
          tax_id: product.tax_id || 1,
          ...(isQuotationBased
            ? { quotation_id: orderData.quotation.quotation_id }
            : { work_order_id: Number(id) }
          ),
        };

        if (product.work_product_detail_id && product._modified) {
          // Update existing product
          await updateWorkProductDetail(product.work_product_detail_id, detailPayload);

          // Update stock if quantity changed
          const originalQuantity = product.originalQuantity || 0;
          const quantityDiff = product.quantity - originalQuantity;

          if (quantityDiff !== 0) {
            const stockProduct = stockProducts.find(sp => sp.product?.product_id === product.product_id);
            if (stockProduct && stockProduct.stock_product_id) {
              // Subtract the additional quantity from stock
              const updatedQuantity = stockProduct.quantity - quantityDiff;
              await updateStockProduct(stockProduct.stock_product_id.toString(), {
                ...stockProduct,
                quantity: updatedQuantity,
              });
            }
          }
        } else if (!product.work_product_detail_id) {
          // Create new product detail
          await createWorkProductDetail(detailPayload);

          // Update stock
          const stockProduct = stockProducts.find(sp => sp.product?.product_id === product.product_id);
          if (stockProduct && stockProduct.stock_product_id) {
            const updatedQuantity = stockProduct.quantity - product.quantity;
            await updateStockProduct(stockProduct.stock_product_id.toString(), {
              ...stockProduct,
              quantity: updatedQuantity,
            });
          }
        }
      }

      toast.success("Orden de trabajo y detalles actualizados exitosamente");
      navigate("/admin/orden-trabajo");
      setTimeout(() => window.location.reload(), 100);
    } catch (error) {
      console.error("Error updating work order:", error);
      toast.error("Error al actualizar la orden de trabajo");
    } finally {
      setSubmitting(false);
      // Clear deleted products list
      setProductsToDelete([]);
    }
  };

  // Cálculos de totales
  const totalProductPrice = products.reduce(
    (acc, p) => acc + Number(p.sale_price) * Number(p.quantity),
    0
  );
  const totalLaborPrice = products.reduce(
    (acc, p) => acc + Number(p.labor_price),
    0
  );
  const subtotal = totalProductPrice + totalLaborPrice;
  const ivaAmount = subtotal * taxRate;
  const totalAmount = subtotal + ivaAmount;

  const translateStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      finished: "Finalizado",
      in_progress: "En progreso",
      not_started: "No iniciado",
    };
    return statusMap[status] || status;
  };

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const employees = await fetchPersonsEmployee();
        setTechnicians(employees);
      } catch (error) {
        console.error("Error loading technicians:", error);
        toast.error("Error al cargar Mécanicos disponibles");
      }
    };
    fetchTechnicians();
  }, []);

  useEffect(() => {
    if (id) {
      const fetchAssignedTechnicians = async () => {
        try {
          const workOrderId = Number(id);
          const assignedTechs = await getWorkOrderTechnicians(workOrderId);
          setAssignedTechnicians(assignedTechs);
        } catch (error) {
          console.error("Error loading assigned technicians:", error);
          toast.error("Error al cargar Mécanicos asignados");
        }
      };
      fetchAssignedTechnicians();
    }
  }, [id]);

  const handleAssignTechnician = async () => {
    if (!selectedTechnicianId || !id) {
      toast.error("Por favor seleccione un Mécanico");
      return;
    }
    setLoadingTechnicians(true);
    try {
      const workOrderId = Number(id);
      await createWorkOrderTechnician({
        work_order_id: workOrderId,
        technician_id: selectedTechnicianId,
      });
      const assignedTech = await getWorkOrderTechnicians(workOrderId);
      setAssignedTechnicians(assignedTech);
      setSelectedTechnicianId(null);
      toast.success("Mécanico asignado correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al asignar Mécanico");
    } finally {
      setLoadingTechnicians(false);
    }
  };

  const handleRemoveTechnician = async (assignmentId: number) => {
    if (!id) return;
    try {
      await deleteWorkOrderTechnician(assignmentId);
      setAssignedTechnicians(prev => prev.filter(tech => tech.id !== assignmentId));
      toast.success("Mécanico removido correctamente");
    } catch (error) {
      toast.error("Error al remover Mécanico");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-lg text-muted-foreground">Cargando orden de trabajo...</p>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <p className="mt-4 text-lg text-destructive">{error || "No se encontró la orden de trabajo"}</p>
        <Button className="mt-4" onClick={() => navigate("/admin/orden-trabajo")}>
          Volver a Órdenes de Trabajo
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      className="container mx-auto p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/admin/orden-trabajo")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Wrench className="w-8 h-8" />
            Editar Orden de Trabajo #{orderData.work_order_id}
          </h1>
        </div>
      </div>

      {isQuotationBased && (
        <div className="p-4 border rounded-md bg-blue-50 border-blue-200 flex items-start gap-3 mb-4">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-800">Orden basada en cotización</h3>
            <p className="text-blue-700">
              Esta orden de trabajo está asociada a la cotización #{orderData.quotation.quotation_id}.
              Los productos que agregue se asociarán a esta cotización.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información General y Vehículo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>ID de Orden</Label>
                <div className="bg-muted p-2 rounded-md">{orderData.work_order_id}</div>
              </div>
              <div className="space-y-2">
                <Label>Fecha de Creación</Label>
                <div className="bg-muted p-2 rounded-md">{formatDate(orderData.order_date || new Date())}</div>
              </div>
              {orderData.entry_date && (
                <div className="space-y-2">
                  <Label>Fecha de Entrada</Label>
                  <div className="bg-muted p-2 rounded-md">{formatDate(orderData.entry_date)}</div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="status">Estado de la Orden</Label>
                <Select value={status} onValueChange={setStatus} disabled={submitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">No iniciado</SelectItem>
                    <SelectItem value="in_progress">En progreso</SelectItem>
                    <SelectItem value="finished">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Descripción de la orden de trabajo"
                  disabled={submitting}
                />
              </div>
              {orderData.quotation && (
                <div className="space-y-2 pt-2 border-t">
                  <Label>Cotización Asociada</Label>
                  <div className="bg-muted p-2 rounded-md">
                    <Badge className="bg-primary mb-1">
                      Cotización #{orderData.quotation.quotation_id}
                    </Badge>
                    <p className="text-sm">
                      Fecha: {formatDate(orderData.quotation.entry_date || new Date())}
                    </p>
                    <p className="text-sm">
                      Estado: {translateStatus(orderData.quotation.quotation_status)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                Información del Vehículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderData?.vehicle ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Matrícula</Label>
                      <div className="bg-muted p-2 rounded-md font-medium">
                        {orderData.vehicle.license_plate || "No especificada"}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Año</Label>
                      <div className="bg-muted p-2 rounded-md">
                        {orderData.vehicle.year || "No especificado"}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Marca y Modelo</Label>
                    <div className="bg-muted p-2 rounded-md">
                      {orderData.vehicle.model ? (
                        <>
                          {orderData.vehicle.model.brand?.brand_name || "Sin marca"}{" "}
                          {orderData.vehicle.model.model_name || "Sin modelo"}
                        </>
                      ) : (
                        "Información no disponible"
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Propietario</Label>
                    <div className="bg-muted p-2 rounded-md">
                      {orderData.vehicle.owner ? (
                        <div>
                          <p className="font-medium">
                            {orderData.vehicle.owner.name} {orderData.vehicle.owner.first_surname}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Tel: +{orderData.vehicle.owner.number_phone || "No disponible"}
                          </p>
                        </div>
                      ) : orderData.vehicle.company ? (
                        <div>
                          <p className="font-medium">Empresa: {orderData.vehicle.company.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Tel: +{orderData.vehicle.company.phone || "No disponible"}
                          </p>
                        </div>
                      ) : (
                        "No especificado"
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <Car className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No se encontró información del vehículo</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Asignación de Mécanico */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Asignación de Mécanico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex gap-2">
                  <Select value={selectedTechnicianId?.toString() || ""} onValueChange={(value) => setSelectedTechnicianId(Number(value))}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar Mécanico" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.person_id} value={tech.person_id.toString()}>
                          {tech.name} {tech.first_surname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={handleAssignTechnician}
                    disabled={!selectedTechnicianId || loadingTechnicians}
                  >
                    {loadingTechnicians ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></span>
                    ) : "Asignar"}
                  </Button>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="text-sm font-medium mb-2">Mécanicos Asignados</h4>
                  {assignedTechnicians.length > 0 ? (
                    <div className="space-y-2">
                      {assignedTechnicians.map((assignment) => (
                        <div key={assignment.id} className="flex justify-between items-center p-2 bg-secondary/20 rounded-md">
                          <span>
                            {assignment.technician?.name} {assignment.technician?.first_surname}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveTechnician(assignment.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay Mécanicos asignados</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalles de Productos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">Detalles de Productos</span>
              <Button type="button" variant="outline" size="sm" onClick={handleAddProduct} disabled={submitting}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Producto
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {products && products.length > 0 ? (
              <div className="space-y-4">
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left">Producto</th>
                        {isQuotationBased && <th className="px-4 py-2 text-center">Origen</th>}
                        <th className="px-4 py-2 text-center">Cantidad</th>
                        <th className="px-4 py-2 text-right">Precio Neto</th>
                        <th className="px-4 py-2 text-right">Precio c/Margen</th>
                        <th className="px-4 py-2 text-right">Mano de Obra</th>
                        <th className="px-4 py-2 text-right">Subtotal</th>
                        <th className="px-4 py-2 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map((product, index) => {
                        const productName =
                          (product.product && product.product.product_name) ||
                          (allProducts.find(p => p.product_id === product.product_id)?.product_name) ||
                          `Producto #${product.product_id}`;
                        const foundProduct = allProducts.find(p => p.product_id === product.product_id);
                        const netPrice = foundProduct ? Number(foundProduct.sale_price) : Number(product.sale_price);
                        const margin = foundProduct ? Number(foundProduct.profit_margin) / 100 : 0;
                        const priceWithMargin = Number(product.sale_price);
                        const subtotal = priceWithMargin * Number(product.quantity) + Number(product.labor_price);
                        const stockProduct = stockProducts.find(sp => sp.product?.product_id === product.product_id);
                        const currentStock = stockProduct ? stockProduct.quantity : 0;
                        const isFromQuotation = isQuotationBased &&
                          quotationProducts.some(qp => qp.product_id === product.product_id);
                        return (
                          <tr key={index} className={`hover:bg-muted/50 ${product._isNew ? 'bg-yellow-50' : ''}`}>
                            <td className="px-4 py-2 font-medium">
                              {productName}
                              {product._isNew && (
                                <span className="ml-2 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                                  No guardado
                                </span>
                              )}
                              <div className="text-xs text-green-600 mt-1">
                                Stock disponible: {currentStock}
                              </div>
                            </td>
                            {isQuotationBased && (
                              <td className="px-4 py-2 text-center">
                                <Badge variant={isFromQuotation ? "secondary" : "outline"}>
                                  {isFromQuotation ? "Cotización" : "Añadido"}
                                </Badge>
                              </td>
                            )}
                            <td className="px-4 py-2">
                              <Input
                                type="number"
                                value={product.quantity || 0}
                                onChange={(e) => {
                                  const newValue = Number(e.target.value);
                                  // Let the handler function handle validation
                                  handleProductQuantityChange(index, newValue);
                                }}
                                className="w-20 mx-auto text-center"
                                disabled={submitting}
                                min={1}
                                max={product._isNew ? currentStock : (currentStock + (product.originalQuantity || 0))}
                              />
                              <div className="text-xs text-muted-foreground text-center mt-1">
                                {!product._isNew && product.originalQuantity ?
                                  `Original: ${product.originalQuantity} - Máx adicional: ${currentStock}` :
                                  `Máx: ${currentStock}`
                                }
                              </div>
                            </td>
                            <td className="px-4 py-2 text-right">{formatPriceCLP(netPrice)}</td>
                            <td className="px-4 py-2 text-right">
                              {formatPriceCLP(priceWithMargin)}
                              <span className="text-xs text-muted-foreground block">
                                ({foundProduct ? foundProduct.profit_margin : 0}% margen)
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                type="number"
                                value={product.labor_price || 0}
                                onChange={(e) => handleProductLaborPriceChange(index, Number(e.target.value))}
                                className="w-24 ml-auto text-right"
                                disabled={submitting}
                                min={0}
                              />
                            </td>
                            <td className="px-4 py-2 text-right font-medium">{formatPriceCLP(subtotal)}</td>
                            <td className="px-4 py-2 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveProduct(index)}
                                disabled={submitting}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Totales */}
                <div className="grid grid-cols-2 gap-4 text-sm mt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal Productos:</span>
                      <span className="font-medium">{formatPriceCLP(totalProductPrice)}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded bg-accent/5">
                    <div className="flex justify-between">
                      <span>Total Mano de Obra:</span>
                      <span className="font-medium">{formatPriceCLP(totalLaborPrice)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="p-3 rounded bg-accent/5">
                    <div className="flex justify-between">
                      <span>Subtotal Neto:</span>
                      <span className="font-medium">{formatPriceCLP(subtotal)}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded bg-accent/5">
                    <div className="flex justify-between">
                      <span>IVA (19%):</span>
                      <span className="font-medium">{formatPriceCLP(ivaAmount)}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded bg-primary/10 font-bold">
                    <div className="flex justify-between">
                      <span>TOTAL CON IVA:</span>
                      <span>{formatPriceCLP(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">
                No hay productos agregados a esta orden de trabajo.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/orden-trabajo")} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting} className="gap-2">
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></span>
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Modal para agregar producto - Updated to handle temporary products */}
      <Dialog open={showProductModal} onOpenChange={(isOpen) => {
        if (!isOpen) handleModalClose(false);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Producto</DialogTitle>
            {isQuotationBased && (
              <DialogDescription>
                Este producto se asociará a la cotización #{orderData.quotation.quotation_id}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product">Seleccionar Producto</Label>
              <div className="relative">
                <Command className="rounded-lg border shadow-md">
                  <CommandInput placeholder="Buscar producto..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron productos.</CommandEmpty>
                    <ScrollArea className="h-72">
                      <CommandGroup heading="Productos disponibles">
                        {allProducts
                          .filter(product => {
                            // Verificar si el producto ya existe en la lista temporal (no en products)
                            const existingTempProduct = tempProducts.find(p => p.product_id === product.product_id && p._temp);

                            // Si el producto ya existe en productos temporales, no mostrarlo
                            if (existingTempProduct) {
                              return false;
                            }

                            // Los productos que ya están en la orden NO deben ser filtrados por stock
                            const alreadyInOrder = products.find(p => p.product_id === product.product_id);
                            if (alreadyInOrder) {
                              return false;
                            }

                            // Para productos nuevos, sí verificamos el stock
                            const stockProduct = stockProducts.find(sp => sp.product?.product_id === product.product_id);
                            return stockProduct && stockProduct.quantity > 0;
                          })
                          .map(product => {
                            const stockProduct = stockProducts.find(sp => sp.product?.product_id === product.product_id);
                            const tempProduct = tempProducts.find(p => p.product_id === product.product_id);
                            const isSelected = !!tempProduct;

                            return (
                              <CommandItem
                                key={product.product_id}
                                onSelect={() => {
                                  if (!isSelected) {
                                    handleTempProductChange(product.product_id, 1, 0);
                                  }
                                }}
                                className={isSelected ? "bg-accent text-accent-foreground" : ""}
                              >
                                <div className="flex items-center space-x-4 flex-1">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        handleTempProductChange(product.product_id, 1, 0);
                                      } else {
                                        handleTempRemoveProduct(product.product_id);
                                      }
                                    }}
                                  />
                                  <div className="flex-col">
                                    <span className="font-medium">{product.product_name}</span>
                                    <span className="text-xs text-muted-foreground block">
                                      Precio: {formatPriceCLP(Number(product.sale_price))} - Margen: {product.profit_margin}% - Stock: {stockProduct?.quantity || 0}
                                    </span>
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="flex items-center space-x-2">
                                    <Label htmlFor={`temp-quantity-${product.product_id}`} className="text-xs">
                                      Cantidad:
                                    </Label>
                                    <Input
                                      id={`temp-quantity-${product.product_id}`}
                                      type="number"
                                      min="1"
                                      max={stockProduct?.quantity || 1}
                                      value={tempProduct.quantity}
                                      onChange={(e) => handleTempProductChange(
                                        product.product_id,
                                        Number(e.target.value),
                                        tempProduct.labor_price
                                      )}
                                      className="w-16 h-7 text-xs"
                                    />
                                  </div>
                                )}
                              </CommandItem>
                            );
                          })}
                      </CommandGroup>
                      <CommandGroup heading="Productos sin stock o ya agregados">
                        {allProducts
                          .filter(product => {
                            // Los productos que ya están en productos temporales
                            const existingTempProduct = tempProducts.find(p => p.product_id === product.product_id && p._temp);

                            // Los productos que ya están en la orden
                            const existingProduct = products.find(p => p.product_id === product.product_id);

                            // Si está en los temporales, lo mostramos aquí
                            if (existingTempProduct) {
                              return false; // Ya no lo mostramos en esta sección
                            }

                            // Si está en la orden original pero no en temporales, lo mostramos aquí
                            if (existingProduct) {
                              return true;
                            }

                            // Para productos nuevos, verificamos si no tienen stock
                            const stockProduct = stockProducts.find(sp => sp.product?.product_id === product.product_id);
                            return !stockProduct || stockProduct.quantity <= 0;
                          })
                          .map(product => {
                            const stockProduct = stockProducts.find(sp => sp.product?.product_id === product.product_id);
                            const existingProduct = products.find(p => p.product_id === product.product_id);

                            let statusMessage = "";
                            if (existingProduct) {
                              statusMessage = "Ya agregado a la orden";
                            } else {
                              statusMessage = `Margen: ${product.profit_margin}% - Sin stock`;
                            }

                            return (
                              <CommandItem
                                key={product.product_id}
                                className="opacity-50 cursor-not-allowed"
                                disabled
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{product.product_name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    Precio: {formatPriceCLP(Number(product.sale_price))} - {statusMessage}
                                  </span>
                                </div>
                              </CommandItem>
                            );
                          })}
                      </CommandGroup>
                    </ScrollArea>
                  </CommandList>
                </Command>
              </div>
            </div>

            {/* Show selected products in modal */}
            {tempProducts.some(p => p._temp) && (
              <div className="space-y-2">
                <Label>Productos seleccionados:</Label>
                <ScrollArea className="h-40 border rounded p-2">
                  <ul className="space-y-2">
                    {tempProducts
                      .filter(p => p._temp)
                      .map(product => {
                        const foundProduct = allProducts.find(p => p.product_id === product.product_id);
                        const stockProduct = stockProducts.find(sp => sp.product?.product_id === product.product_id);

                        return (
                          <li key={product.product_id} className="flex items-center justify-between text-sm p-1 border-b">
                            <div>
                              <p>{foundProduct?.product_name || `Producto #${product.product_id}`}</p>
                              <p className="text-xs text-muted-foreground">
                                Stock: {stockProduct?.quantity || 0}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex flex-col items-end">
                                <Label htmlFor={`modal-quantity-${product.product_id}`} className="text-xs">
                                  Cantidad
                                </Label>
                                <Input
                                  id={`modal-quantity-${product.product_id}`}
                                  type="number"
                                  min="1"
                                  max={stockProduct?.quantity || 1}
                                  value={product.quantity}
                                  onChange={(e) => {
                                    const newQuantity = Number(e.target.value);
                                    handleTempProductChange(product.product_id, newQuantity, product.labor_price);
                                  }}
                                  className="w-16 h-7 text-xs"
                                />
                              </div>
                              <div className="flex flex-col items-end">
                                <Label htmlFor={`modal-labor-${product.product_id}`} className="text-xs">
                                  M. Obra
                                </Label>
                                <Input
                                  id={`modal-labor-${product.product_id}`}
                                  type="number"
                                  min="0"
                                  value={product.labor_price}
                                  onChange={(e) => {
                                    const newLaborPrice = Number(e.target.value);
                                    handleTempProductChange(product.product_id, product.quantity, newLaborPrice);
                                  }}
                                  className="w-20 h-7 text-xs"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => handleTempRemoveProduct(product.product_id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                </ScrollArea>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => handleModalClose(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleModalClose(true)}>
              Aplicar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default WorkOrderEditPage;
