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
import { fetchPersonsEmployee } from "@/services/personService";
import {
  createWorkOrderTechnician,
  getWorkOrderTechnicians,
  deleteWorkOrderTechnician,
} from "@/services/workOrderTechnicianService";
import { Person, WorkOrderTechnician } from "@/types/interfaces";
import { getActiveTax } from "@/services/taxService";
import { SparePartsModal } from "@/components/quotations/SparePartsModal";
import { QuickProductCreateDialog } from "@/components/products/QuickProductCreateDialog";

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
  const [, setSelectedProductId] = useState<number | null>(null);
  const [, setProductQuantity] = useState<number>(1);
  const [, setProductLaborPrice] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0.19);
  const [activeTaxId, setActiveTaxId] = useState<number>(1);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(19);
  // Para distinguir órdenes basadas en cotización
  const [isQuotationBased, setIsQuotationBased] = useState<boolean>(false);
  const [quotationProducts, setQuotationProducts] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<Person[]>([]);
  const [assignedTechnicians, setAssignedTechnicians] = useState<WorkOrderTechnician[]>([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(null);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [productsToDelete, setProductsToDelete] = useState<number[]>([]); // Track products to delete
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Track unsaved changes
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [tempSelectedProducts, setTempSelectedProducts] = useState<Array<{
    productId: number;
    quantity: number;
    laborPrice: number;
    workProductDetailId?: number;
    originalSalePrice?: number;
    originalQuantity?: number;
  }>>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const productsData = await fetchProducts();
        setAllProducts(productsData);

        // Cargar stock
        const stockData = await getStockProducts();
        setStockProducts(stockData);

        // Cargar tasa de impuesto activa
        try {
          const taxData = await getActiveTax();
          // Asegurar que tax_rate sea número (PostgreSQL puede devolverlo como string)
          const taxRateNum = Number(taxData.tax_rate);
          const rate = taxRateNum / 100;
          setTaxRate(rate);
          setActiveTaxId(taxData.tax_id);
          setTaxRatePercent(taxRateNum);
        } catch (taxErr) {
          console.warn("Error loading tax, using default 19%:", taxErr);
        }

        await loadWorkOrder();
      } catch (err: any) {
        console.error("Error loading data:", err);
        toast.error(err.response?.data?.message || err.message || "Error al cargar la información");
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

      // Verificar si hay detalles de productos (productDetails sin guión bajo)
      if (data.productDetails && data.productDetails.length > 0) {
        // Agregar originalQuantity para seguimiento
        const enhancedProducts = data.productDetails.map((product: any) => ({
          ...product,
          originalQuantity: product.quantity,
        }));
        setProducts(enhancedProducts);
        console.log("Loaded product details:", enhancedProducts);
      } else {
        console.log("No product details found in work order data");
      }

      if (hasQuotation && data.quotation && data.quotation.quotation_id) {
        try {
          const quotationDetails = await getWorkProductDetailsByQuotationId(data.quotation.quotation_id);
          setQuotationProducts(quotationDetails || []);
        } catch (detailError) {
          console.error("Error loading quotation details:", detailError);
        }
      }
      setStatus(data.order_status || "not_started");
    } catch (err: any) {
      console.error("Error loading work order:", err);
      setError("No se pudo cargar la información de la orden de trabajo");
      toast.error(err.response?.data?.message || err.message || "Error al cargar la orden de trabajo");
    } finally {
      setLoading(false);
    }
  };

  // Modified to use temp products state
  const handleAddProduct = () => {
    // Inicializar productos temporales con los productos actuales
    setTempSelectedProducts(
      products
        .filter(p => !p._markedForDeletion)
        .map(p => ({
          productId: p.product_id,
          quantity: p.quantity,
          laborPrice: p.labor_price || 0,
          workProductDetailId: p.work_product_detail_id,
          originalSalePrice: p.sale_price,
          originalQuantity: p.originalQuantity
        }))
    );
    setShowProductModal(true);
    setSelectedProductId(null);
    setProductQuantity(1);
    setProductLaborPrice(0);
  };

  // Calcular precio con margen
  const calculateTotalWithMargin = (salePrice: number, quantity: number, profitMargin: number) => {
    const finalPrice = Number(salePrice) * (1 + Number(profitMargin) / 100);
    return finalPrice * quantity;
  };

  // Handle product change in modal (temporary state)
  const handleTempProductChange = (productId: number, quantity: number, laborPrice: number) => {
    const selectedProduct = allProducts.find(p => p.product_id === productId);
    if (!selectedProduct) return;

    // Validate stock for new products
    const stockProduct = stockProducts.find(sp => sp.product?.product_id === productId);
    const availableStock = stockProduct ? stockProduct.quantity : 0;
    const existingProduct = products.find(p => p.product_id === productId && !p._markedForDeletion);
    
    // Para productos nuevos, validar stock completo
    if (!existingProduct && quantity > availableStock) {
      toast.error(`No hay suficiente stock para ${selectedProduct.product_name}. Disponible: ${availableStock}`);
      return;
    }

    setTempSelectedProducts(prev => {
      const existingIndex = prev.findIndex(p => p.productId === productId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity, laborPrice };
        return updated;
      }
      return [...prev, { productId, quantity, laborPrice }];
    });
  };

  // Remove product from temp state
  const handleTempRemoveProduct = (productId: number) => {
    setTempSelectedProducts(prev => prev.filter(p => p.productId !== productId));
  };

  // Handle modal close
  const handleModalClose = (save: boolean) => {
    if (save) {
      // Aplicar cambios temporales a los productos reales
      const newProducts: any[] = [];
      
      for (const tempProduct of tempSelectedProducts) {
        const existingProduct = products.find(p => p.product_id === tempProduct.productId);
        const productData = allProducts.find(p => p.product_id === tempProduct.productId);
        
        if (!productData) continue;
        
        const basePrice = Number(productData.sale_price);
        const margin = Number(productData.profit_margin) / 100;
        const priceWithMargin = Number((basePrice * (1 + margin)).toFixed(2));
        
        if (existingProduct && !existingProduct._markedForDeletion) {
          // Actualizar producto existente
          newProducts.push({
            ...existingProduct,
            quantity: tempProduct.quantity,
            labor_price: tempProduct.laborPrice,
            _modified: existingProduct.quantity !== tempProduct.quantity || 
                       existingProduct.labor_price !== tempProduct.laborPrice
          });
        } else {
          // Nuevo producto
          newProducts.push({
            product_id: tempProduct.productId,
            product: productData,
            quantity: tempProduct.quantity,
            sale_price: priceWithMargin,
            labor_price: tempProduct.laborPrice,
            _isNew: true
          });
        }
      }
      
      // Mantener productos marcados para eliminación
      const deletedProducts = products.filter(p => p._markedForDeletion);
      
      setProducts([...newProducts, ...deletedProducts]);
      setHasUnsavedChanges(true);
    }
    setShowProductModal(false);
  };

  // Modified to only mark products for deletion and track unsaved changes
  const handleRemoveProduct = (index: number) => {
    const productToRemove = products[index];

    if (productToRemove.work_product_detail_id) {
      // Validate that the ID is valid before adding to deletion list
      const detailId = productToRemove.work_product_detail_id;

      if (typeof detailId === 'number' && detailId > 0 && !Number.isNaN(detailId)) {
        // Only add to deletion list if it has a valid ID (exists in database)
        setProductsToDelete(prev => {
          // Avoid duplicates
          if (!prev.includes(detailId)) {
            console.log(`Adding product detail ${detailId} to deletion list`);
            return [...prev, detailId];
          }
          console.log(`Product detail ${detailId} already in deletion list`);
          return prev;
        });

        // Mark the product as deleted in the UI but keep it in the list
        setProducts(prev => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            _markedForDeletion: true
          };
          return updated;
        });

        console.log(`Marked product detail ${detailId} for deletion`);
      } else {
        console.warn(`Invalid work_product_detail_id:`, detailId);
        // For invalid IDs, just remove from UI
        setProducts(prev => prev.filter((_, i) => i !== index));
      }
    } else {
      // For new products that haven't been saved yet, remove them immediately
      // These don't need to be "deleted" from the database since they don't exist there
      setProducts(prev => prev.filter((_, i) => i !== index));
      console.log(`Removed new product from UI (no database deletion needed)`);
    }

    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
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
        quantity: Number(newQuantity), // Ensure it's a number
        _modified: true
      };

      console.log("Updated product at index", index, ":", updated[index]); // Debug log

      // Mark as having unsaved changes
      setHasUnsavedChanges(true);

      return updated;
    });
  };

  // Also modify the handler for labor price to mark products as modified
  const handleProductLaborPriceChange = (index: number, newLaborPrice: number) => {
    setProducts(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        labor_price: Number(newLaborPrice), // Ensure it's a number
        _modified: true
      };
      console.log("Updated labor price for product at index", index, ":", updated[index]);

      // Mark as having unsaved changes
      setHasUnsavedChanges(true);

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
      if (product._markedForDeletion) continue;

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
        order_status: status as "finished" | "in_progress" | "not_started",
        total_amount: totalAmount,
        tax_rate: Number(taxRatePercent),
        subtotal: Math.trunc(subtotal),
        tax_amount: Math.trunc(ivaAmount),
      });

      // Process deletions first - Only use the productsToDelete list to avoid duplicates
      // Don't use products.filter(p => p._markedForDeletion) as those are already in productsToDelete
      const validProductsToDelete = productsToDelete.filter(id =>
        id && typeof id === 'number' && id > 0 && !Number.isNaN(id)
      );

      console.log("Valid products to delete from database:", validProductsToDelete);

      const deletionErrors: string[] = [];

      // Process deletions sequentially to avoid race conditions
      for (const detailId of validProductsToDelete) {
        try {
          console.log(`Attempting to delete work product detail ${detailId}`);
          // Backend now handles stock restoration automatically
          await deleteWorkProductDetail(detailId);
          console.log(`Successfully deleted work product detail ${detailId}`);
        } catch (error: any) {
          console.error(`Error deleting work product detail ${detailId}:`, error);

          // If it's a 404, the detail doesn't exist anymore, which is acceptable
          // This can happen if the detail was already deleted by another process
          if (error.response?.status === 404) {
            console.log(`Work product detail ${detailId} not found (404), already deleted or doesn't exist`);
          } else {
            // For other errors, collect them but don't stop the entire save process
            deletionErrors.push(`Error deleting product detail ${detailId}: ${error.message || 'Unknown error'}`);
          }
        }
      }

      // Show appropriate success/warning messages
      if (deletionErrors.length === 0 && validProductsToDelete.length > 0) {
        toast.success(`${validProductsToDelete.length} producto(s) eliminado(s) exitosamente`);
      } else if (deletionErrors.length > 0 && validProductsToDelete.length > deletionErrors.length) {
        toast.success(`${validProductsToDelete.length - deletionErrors.length} de ${validProductsToDelete.length} productos eliminados`);
      }

      // Remove products that were successfully marked for deletion from the UI
      // This cleans up the UI regardless of whether the backend deletion succeeded
      setProducts(prev => prev.filter(p => !p._markedForDeletion && !productsToDelete.includes(p.work_product_detail_id)));

      // Process each product: update if modified, create if new
      // Only process products that are still in the products array (not deleted)
      const remainingProducts = products.filter(p => !p._markedForDeletion);

      for (const product of remainingProducts) {
        const detailPayload = {
          product_id: Number(product.product_id),
          quantity: Number(product.quantity),
          sale_price: Number(Number(product.sale_price).toFixed(2)),
          labor_price: Number(Number(product.labor_price || 0).toFixed(2)),
          discount: Number(product.discount || 0),
          tax_id: Number(product.tax_id || activeTaxId),
          applied_tax_rate: Number(taxRatePercent),
          ...(isQuotationBased
            ? { quotation_id: Number(orderData.quotation.quotation_id) }
            : { work_order_id: Number(id) }
          ),
        };

        console.log("Sending detailPayload:", detailPayload); // Debug log

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
                quantity: updatedQuantity,
                updated_at: new Date()
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
              quantity: updatedQuantity,
              updated_at: new Date()
            });
          }
        }
      }

      toast.success("Orden de trabajo y detalles actualizados exitosamente");
      setHasUnsavedChanges(false); // Reset unsaved changes flag

      // Reload stock data to reflect changes
      try {
        const stockData = await getStockProducts();
        setStockProducts(stockData);
      } catch (error) {
        console.error("Error reloading stock data:", error);
      }

      navigate("/admin/orden-trabajo");
      setTimeout(() => window.location.reload(), 100);
    } catch (error: any) {
      console.error("Error updating work order:", error);
      toast.error(error.response?.data?.message || error.message || "Error al actualizar la orden de trabajo");
    } finally {
      setSubmitting(false);
      // Clear deleted products list to avoid duplicate deletions on next save
      setProductsToDelete([]);
    }
  };

  // Cálculos de totales
  const totalProductPrice = products
    .filter(p => !p._markedForDeletion) // Exclude products marked for deletion
    .reduce(
      (acc, p) => acc + Number(p.sale_price) * Number(p.quantity),
      0
    );
  const totalLaborPrice = products
    .filter(p => !p._markedForDeletion) // Exclude products marked for deletion
    .reduce(
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
      } catch (error: any) {
        console.error("Error loading technicians:", error);
        toast.error(error.response?.data?.message || error.message || "Error al cargar Mécanicos disponibles");
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
        } catch (error: any) {
          console.error("Error loading assigned technicians:", error);
          toast.error(error.response?.data?.message || error.message || "Error al cargar Mécanicos asignados");
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Error al remover Mécanico");
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
        <div className="p-4 border rounded-md flex items-start gap-3 mb-4" style={{ backgroundColor: 'var(--stat-blue-bg)', borderColor: 'var(--balance-net-border)' }}>
          <Info className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--stat-blue-text)' }} />
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--stat-blue-text-secondary)' }}>Orden basada en cotización</h3>
            <p style={{ color: 'var(--stat-blue-text)' }}>
              Esta orden de trabajo está asociada a la cotización #{orderData.quotation.quotation_id}.
              Los productos que agregue se asociarán a esta cotización.
            </p>
          </div>
        </div>
      )}

      {/* Mostrar aviso si hay cambios sin guardar */}
      {hasUnsavedChanges && (
        <div className="p-4 border rounded-md flex items-start gap-3 mb-4" style={{ backgroundColor: 'var(--stat-orange-bg)', borderColor: 'var(--stat-orange-text)' }}>
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--stat-orange-text)' }} />
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--stat-orange-text-secondary)' }}>Cambios sin guardar</h3>
            <p style={{ color: 'var(--stat-orange-text)' }}>
              Tiene cambios sin guardar. Asegúrese de guardar antes de salir.
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
                <Select value={status} onValueChange={(value) => {
                  setStatus(value);
                  setHasUnsavedChanges(true);
                }} disabled={submitting}>
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
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
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
                        <div key={assignment.id} className="flex justify-between items-center p-3 bg-secondary/20 rounded-md">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {assignment.technician?.name} {assignment.technician?.first_surname}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Asignado: {assignment.assigned_at ?
                                new Date(assignment.assigned_at).toLocaleDateString('es-CL', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'Fecha no disponible'}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => assignment.id && handleRemoveTechnician(assignment.id)}>
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
                        const priceWithMargin = Number(product.sale_price);
                        const subtotal = priceWithMargin * Number(product.quantity) + Number(product.labor_price);
                        const stockProduct = stockProducts.find(sp => sp.product?.product_id === product.product_id);
                        const currentStock = stockProduct ? stockProduct.quantity : 0;
                        const isFromQuotation = isQuotationBased &&
                          quotationProducts.some(qp => qp.product_id === product.product_id);
                        return (
                          <tr key={index} className={`hover:bg-muted/50 ${product._isNew ? 'bg-yellow-50' : ''} ${product._markedForDeletion ? 'bg-red-50 opacity-60' : ''}`}>
                            <td className="px-4 py-2 font-medium">
                              <div className={product._markedForDeletion ? 'line-through text-muted-foreground' : ''}>
                                {productName}
                                {product._isNew && !product._markedForDeletion && (
                                  <span className="ml-2 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                                    No guardado
                                  </span>
                                )}
                                {product._markedForDeletion && (
                                  <span className="ml-2 text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                                    Será eliminado
                                  </span>
                                )}
                              </div>
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
                                disabled={submitting || product._markedForDeletion}
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
                                disabled={submitting || product._markedForDeletion}
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
                      <span>IVA ({taxRatePercent}%):</span>
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
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (hasUnsavedChanges) {
                const confirmed = window.confirm(
                  "Tiene cambios sin guardar. ¿Está seguro de que desea salir sin guardar?"
                );
                if (confirmed) {
                  navigate("/admin/orden-trabajo");
                }
              } else {
                navigate("/admin/orden-trabajo");
              }
            }}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting} className={`gap-2 ${hasUnsavedChanges ? 'bg-orange-600 hover:bg-orange-700' : ''}`}>
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></span>
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {hasUnsavedChanges ? 'Guardar Cambios *' : 'Guardar Cambios'}
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Modal para agregar producto */}
      <SparePartsModal
        open={showProductModal}
        onOpenChange={(open) => {
          if (!open) handleModalClose(false);
        }}
        products={allProducts}
        stockProducts={stockProducts}
        selectedProducts={tempSelectedProducts}
        onProductChange={handleTempProductChange}
        onRemoveProduct={handleTempRemoveProduct}
        onConfirm={() => handleModalClose(true)}
        onCancel={() => handleModalClose(false)}
        onCreateProduct={() => setShowCreateProductModal(true)}
        calculatePrice={calculateTotalWithMargin}
        showStock={true}
        requireStock={true}
        title="Agregar Productos"
        description={isQuotationBased 
          ? `Los productos se asociarán a la cotización #${orderData?.quotation?.quotation_id}`
          : "Selecciona los productos para la orden de trabajo"
        }
      />

      {/* Dialog para crear producto rápido */}
      <QuickProductCreateDialog
        open={showCreateProductModal}
        onOpenChange={setShowCreateProductModal}
        onProductCreated={async () => {
          // Recargar productos y stock
          const productsData = await fetchProducts();
          setAllProducts(productsData);
          const stockData = await getStockProducts();
          setStockProducts(stockData);
        }}
      />
    </motion.div>
  );
};

export default WorkOrderEditPage;
