import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createWorkProductDetail,
  updateWorkProductDetail,
  deleteWorkProductDetail,
  getWorkProductDetailsByQuotationId
} from "@/services/workProductDetail";
import { getCompleteWorkOrderById, updateWorkOrder } from "@/services/workOrderService";
import { fetchProducts } from "@/services/productService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Car, Wrench, FileText, AlertCircle, Plus, Trash2, Info, User, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { formatDate } from "@/utils/formDate";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchPersonsEmployee } from "@/services/personService";
import { createWorkOrderTechnician, getWorkOrderTechnicians, deleteWorkOrderTechnician } from "@/services/workOrderTechnicianService";
import { Person, WorkOrderTechnician } from "@/types/interfaces";

const WorkOrderEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<any>(null);
  const [description, setDescription] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [status, setStatus] = useState<string>("not_started");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [productQuantity, setProductQuantity] = useState<number>(1);
  const [productLaborPrice, setProductLaborPrice] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0.19);
  // New state to track if the order is quotation-based
  const [isQuotationBased, setIsQuotationBased] = useState<boolean>(false);
  const [quotationProducts, setQuotationProducts] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<Person[]>([]);
  const [assignedTechnicians, setAssignedTechnicians] = useState<WorkOrderTechnician[]>([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(null);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const productsData = await fetchProducts();
        setAllProducts(productsData);
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
      if (data.vehicle) {
        console.log("Vehicle data:", data.vehicle);
      }
      setOrderData(data);
      setDescription(data.description || "");

      // Check if the order is based on a quotation
      const hasQuotation = !!data.quotation?.quotation_id;
      setIsQuotationBased(hasQuotation);

      if (data.productDetails && data.productDetails.length > 0) {
        console.log("Using product details from work order:", data.productDetails);
        setProducts(data.productDetails);
      }

      // If the order is quotation-based, also load the quotation products
      if (hasQuotation) {
        try {
          console.log("Fetching product details from quotation:", data.quotation.quotation_id);
          const quotationDetails = await getWorkProductDetailsByQuotationId(data.quotation.quotation_id);
          console.log("Quotation details:", quotationDetails);

          // Store quotation products separately for reference
          setQuotationProducts(quotationDetails || []);

          // If no work order products were loaded earlier, use the quotation products
          if (!data.productDetails || data.productDetails.length === 0) {
            setProducts(quotationDetails || []);
          }
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

  const handleAddProduct = () => {
    setShowProductModal(true);
    setSelectedProductId(null);
    setProductQuantity(1);
    setProductLaborPrice(0);
  };

  const handleAddProductConfirm = async () => {
    if (!selectedProductId) {
      toast.error("Por favor seleccione un producto");
      return;
    }

    const selectedProduct = allProducts.find(p => p.product_id === selectedProductId);
    if (!selectedProduct) return;

    const basePrice = Number(selectedProduct.sale_price);
    const margin = Number(selectedProduct.profit_margin) / 100;
    const priceWithMargin = basePrice * (1 + margin);

    // Create new product with appropriate associations
    const newProductDetail = {
      product_id: selectedProductId,
      product: selectedProduct,
      quantity: productQuantity,
      sale_price: priceWithMargin,
      labor_price: productLaborPrice,
      tax_id: 1, // Default tax ID
      original_price: basePrice,
      profit_margin: selectedProduct.profit_margin,
      // Associate with work order or quotation based on the source
      work_order_id: isQuotationBased ? undefined : Number(id),
      quotation_id: isQuotationBased ? orderData.quotation.quotation_id : undefined,
    };

    try {
      // If this is a new product (not already in the work order), create it in the database
      const createdDetail = await createWorkProductDetail(newProductDetail);

      // Add the created detail to the products list with its ID
      setProducts(prev => [...prev, {
        ...newProductDetail,
        work_product_detail_id: createdDetail.work_product_detail_id
      }]);

      toast.success("Producto agregado exitosamente");
    } catch (error) {
      console.error("Error creating product detail:", error);
      toast.error("Error al agregar el producto");

      // Still add to local state for UI consistency, but mark it as not saved
      setProducts(prev => [...prev, {
        ...newProductDetail,
        _isNew: true // Mark as new/unsaved for tracking
      }]);
    }

    setShowProductModal(false);
  };

  // Function to remove a product
  const handleRemoveProduct = async (index: number) => {
    const productToRemove = products[index];

    if (productToRemove.work_product_detail_id) {
      try {
        await deleteWorkProductDetail(productToRemove.work_product_detail_id);
        toast.success("Producto eliminado exitosamente");
      } catch (error) {
        console.error("Error deleting product detail:", error);
        toast.error("Error al eliminar el producto");
        return;
      }
    }

    setProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleProductQuantityChange = (index: number, value: number) => {
    setProducts(prev =>
      prev.map((p, i) => i === index ? { ...p, quantity: value } : p)
    );
  };

  const handleProductLaborPriceChange = (index: number, value: number) => {
    setProducts(prev =>
      prev.map((p, i) => i === index ? { ...p, labor_price: value } : p)
    );
  };

  // Function to submit the work order with modified products
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Payload only with work order data (no productDetails)
    const orderPayload = {
      description,
      order_status: status,
      total_amount: totalAmount,
    };

    try {
      setSubmitting(true);
      await updateWorkOrder(Number(id), orderPayload);

      // Process each product detail individually
      for (const product of products) {
        // Skip products that already exist and haven't been modified
        if (product.work_product_detail_id &&
          !product._modified) {
          continue;
        }

        const detailPayload = {
          product_id: product.product_id,
          quantity: Number(product.quantity),
          sale_price: Number(product.sale_price),
          labor_price: Number(product.labor_price),
          discount: product.discount || 0,
          tax_id: product.tax_id || 1,
          // Set associations based on source
          work_order_id: isQuotationBased ? undefined : Number(id),
          quotation_id: isQuotationBased ? orderData.quotation.quotation_id : undefined
        };

        if (product.work_product_detail_id) {
          // Update existing product detail
          await updateWorkProductDetail(product.work_product_detail_id, detailPayload);
        } else {
          // Create new product detail
          await createWorkProductDetail(detailPayload);
        }
      }

      toast.success("Orden de trabajo y detalles actualizados exitosamente");
      // Navigate first, then reload the page after a short delay to ensure navigation completes
      navigate("/admin/orden-trabajo");
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error("Error updating work order:", error);
      toast.error("Error al actualizar la orden de trabajo");
    } finally {
      setSubmitting(false);
    }
  };

  // Function to show clearly the price with margin
  const calculatePriceWithMargin = (basePrice: number, profitMargin: number) => {
    return basePrice * (1 + profitMargin / 100);
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

  // Load technicians (employees with trabajador role)
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

  // Load assigned technicians whenever work order ID changes
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

  // Handle technician assignment
  const handleAssignTechnician = async () => {
    if (!selectedTechnicianId || !id) {
      toast.error("Por favor seleccione un Mécanico");
      return;
    }

    setLoadingTechnicians(true);
    try {
      const workOrderId = Number(id);
      const newAssignment = await createWorkOrderTechnician({
        work_order_id: workOrderId,
        technician_id: selectedTechnicianId
      });

      // Add the new assignment to the list
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

  // Handle removing technician assignment
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información general */}
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

          {/* Información del vehículo */}
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

          {/* Technician Assignment Card */}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTechnician(assignment.id)}
                          >
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
                        {isQuotationBased && (
                          <th className="px-4 py-2 text-center">Origen</th>
                        )}
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

                        // Determine if this product is from a quotation
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
                                onChange={(e) => handleProductQuantityChange(index, Number(e.target.value))}
                                className="w-20 mx-auto text-center"
                                disabled={submitting}
                                min={1}
                              />
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
                                value={product.labor_price || 0} y
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
                <div className="grid grid-cols-2 gap-4 text-sm mt-6">
                  <div className="space-y-2">
                    <div className="p-3 rounded bg-accent/5"></div>
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

      {/* Modal para agregar producto */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
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
                      <CommandGroup>
                        {allProducts.map((product) => (
                          <CommandItem
                            key={product.product_id}
                            onSelect={() => setSelectedProductId(product.product_id)}
                            className={selectedProductId === product.product_id ? "bg-accent text-accent-foreground" : ""}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{product.product_name}</span>
                              <span className="text-xs text-muted-foreground">
                                Precio: {formatPriceCLP(Number(product.sale_price))} - Margen: {product.profit_margin}%
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </ScrollArea>
                  </CommandList>
                </Command>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="laborPrice">Mano de Obra</Label>
                <Input
                  id="laborPrice"
                  type="number"
                  min="0"
                  value={productLaborPrice}
                  onChange={(e) => setProductLaborPrice(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowProductModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddProductConfirm}>Agregar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default WorkOrderEditPage;
