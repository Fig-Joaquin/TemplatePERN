"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, ArrowLeft, Package, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import {
  createProductPurchase,
  getProductsForPurchase,
  type CreatePurchaseData
} from "@/services/productPurchaseService";
import { getStockProducts } from "@/services/stockProductService";
import type { StockProduct } from "@/types/interfaces";

interface Product {
  product_id: number;
  product_name: string;
  type: {
    type_name: string;
  };
  supplier?: {
    supplier_name: string;
  };
  last_purchase_price: number;
  sale_price: number;
}

interface PurchaseItem {
  product_id: number;
  product?: Product;
  purchase_status: "processed" | "returned";
  purchase_price: number;
  quantity: number;
  total_price: number;
}

const CreateProductPurchasePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockProducts, setStockProducts] = useState<StockProduct[]>([]);
  const [showOnlyOutOfStock, setShowOnlyOutOfStock] = useState(false);

  // Form data
  const [purchaseDate, setPurchaseDate] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [description, setDescription] = useState("");
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([
    {
      product_id: 0,
      purchase_status: "processed",
      purchase_price: 0,
      quantity: 1,
      total_price: 0
    }
  ]);

  useEffect(() => {
    loadInitialData();
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    setPurchaseDate(today);
    setArrivalDate(today);
  }, []);

  const loadInitialData = async () => {
    try {
      const [productsData, stockData] = await Promise.all([
        getProductsForPurchase(),
        getStockProducts()
      ]);
      setProducts(productsData);
      setStockProducts(stockData);
    } catch (error: any) {
      console.error("Error al cargar datos:", error);
      toast.error(error.response?.data?.message || error.message || "Error al cargar los datos necesarios");
    }
  };

  // Función para obtener productos filtrados
  const getFilteredProducts = () => {
    if (showOnlyOutOfStock) {
      return products.filter(product => {
        const stockProduct = stockProducts.find(sp => sp.product?.product_id === product.product_id);
        return !stockProduct || stockProduct.quantity === 0;
      });
    }
    return products;
  };

  const addPurchaseItem = () => {
    setPurchaseItems([
      ...purchaseItems,
      {
        product_id: 0,
        purchase_status: "processed",
        purchase_price: 0,
        quantity: 1,
        total_price: 0
      }
    ]);
  };

  const removePurchaseItem = (index: number) => {
    if (purchaseItems.length > 1) {
      const newItems = purchaseItems.filter((_, i) => i !== index);
      setPurchaseItems(newItems);
    }
  };

  const updatePurchaseItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...purchaseItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate total price when price or quantity changes
    if (field === 'purchase_price' || field === 'quantity') {
      const item = newItems[index];
      // Asegurar que ambos valores sean números
      const price = Number(item.purchase_price) || 0;
      const quantity = Number(item.quantity) || 0;
      item.total_price = price * quantity;
    }

    // Auto-fill purchase price when product is selected
    if (field === 'product_id') {
      const selectedProduct = products.find(p => p.product_id === value);
      if (selectedProduct) {
        newItems[index].product = selectedProduct;
        // Asegurar que el precio sea un número
        const lastPurchasePrice = Number(selectedProduct.last_purchase_price) || 0;
        newItems[index].purchase_price = lastPurchasePrice;
        const quantity = Number(newItems[index].quantity) || 0;
        newItems[index].total_price = lastPurchasePrice * quantity;
      }
    }

    setPurchaseItems(newItems);
  };

  const calculateGrandTotal = () => {
    return purchaseItems.reduce((total, item) => total + Number(item.total_price || 0), 0);
  };

  const validateForm = () => {
    if (!purchaseDate) {
      toast.error("La fecha de compra es requerida");
      return false;
    }
    if (!arrivalDate) {
      toast.error("La fecha de llegada es requerida");
      return false;
    }
    if (!description.trim()) {
      toast.error("La descripción es requerida");
      return false;
    }
    if (description.length < 10) {
      toast.error("La descripción debe tener al menos 10 caracteres");
      return false;
    }

    for (let i = 0; i < purchaseItems.length; i++) {
      const item = purchaseItems[i];
      if (!item.product_id) {
        toast.error(`Debe seleccionar un producto para el ítem ${i + 1}`);
        return false;
      }
      if (Number(item.purchase_price) <= 0) {
        toast.error(`El precio de compra debe ser mayor a 0 para el ítem ${i + 1}`);
        return false;
      }
      if (Number(item.quantity) <= 0) {
        toast.error(`La cantidad debe ser mayor a 0 para el ítem ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const purchaseData: CreatePurchaseData = {
        purchase_date: purchaseDate,
        arrival_date: arrivalDate,
        description,
        products: purchaseItems.map(item => ({
          product_id: Number(item.product_id),
          purchase_status: item.purchase_status,
          purchase_price: Number(item.purchase_price),
          quantity: Number(item.quantity),
          total_price: Number(item.total_price)
        }))
      };

      console.log("Enviando datos de compra:", purchaseData);
      console.log("Productos a enviar:", purchaseData.products);

      await createProductPurchase(purchaseData);
      toast.success("Compra creada exitosamente");
      navigate("/admin/compras-productos");
    } catch (error: any) {
      console.error("Error al crear compra:", error);
      toast.error(error.response?.data?.message || error.message || "Error al crear la compra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate("/admin/compras-productos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Nueva Compra de Productos</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Purchase Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Compra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchaseDate">Fecha de Compra *</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="arrivalDate">Fecha de Llegada *</Label>
                <Input
                  id="arrivalDate"
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Descripción de la Compra *</Label>
              <Textarea
                id="description"
                placeholder="Describe los detalles de esta compra..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Mínimo 10 caracteres ({description.length}/500)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Productos a Comprar</CardTitle>
              <div className="flex gap-2 items-center">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showOnlyOutOfStock"
                    checked={showOnlyOutOfStock}
                    onChange={(e) => setShowOnlyOutOfStock(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="showOnlyOutOfStock" className="text-sm text-gray-600">
                    Solo sin stock
                  </label>
                </div>
                <Button type="button" onClick={addPurchaseItem} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Producto
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {purchaseItems.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Producto {index + 1}</h4>
                  {purchaseItems.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePurchaseItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>Producto *</Label>
                    <Select
                      value={item.product_id.toString()}
                      onValueChange={(value) => updatePurchaseItem(index, 'product_id', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {getFilteredProducts().map((product) => {
                          const stockProduct = stockProducts.find(sp => sp.product?.product_id === product.product_id);
                          const stockQuantity = stockProduct?.quantity || 0;

                          return (
                            <SelectItem key={product.product_id} value={product.product_id.toString()}>
                              <div>
                                <div className="flex items-center gap-2">
                                  {product.product_name}
                                  {stockQuantity === 0 && (
                                    <Badge variant="destructive" className="text-xs">Sin stock</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {product.type.type_name} - Último precio: {formatPriceCLP(product.last_purchase_price)}
                                  {stockQuantity > 0 && (
                                    <span className="ml-2 text-green-600">Stock: {stockQuantity}</span>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Estado *</Label>
                    <Select
                      value={item.purchase_status}
                      onValueChange={(value) => updatePurchaseItem(index, 'purchase_status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="processed">Procesado</SelectItem>
                        <SelectItem value="returned">Devuelto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Precio de Compra *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.purchase_price}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        updatePurchaseItem(index, 'purchase_price', isNaN(value) ? 0 : value);
                      }}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label>Cantidad *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        updatePurchaseItem(index, 'quantity', isNaN(value) ? 1 : value);
                      }}
                    />
                  </div>

                  <div>
                    <Label>Total</Label>
                    <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                      <span className="font-medium">{formatPriceCLP(item.total_price)}</span>
                    </div>
                  </div>
                </div>

                {item.product && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Tipo:</span> {item.product.type.type_name}
                      </div>
                      {item.product.supplier && (
                        <div>
                          <span className="text-gray-600">Proveedor:</span> {item.product.supplier.supplier_name}
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">Precio de venta:</span> {formatPriceCLP(item.product.sale_price)}
                      </div>
                      <div>
                        <Badge variant={item.purchase_status === "processed" ? "default" : "destructive"}>
                          {item.purchase_status === "processed" ? "Procesado" : "Devuelto"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-lg font-medium">
                    Total General: <span className="text-blue-600">{formatPriceCLP(calculateGrandTotal())}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {purchaseItems.length} producto{purchaseItems.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/compras-productos")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Creando..." : "Crear Compra"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateProductPurchasePage;
