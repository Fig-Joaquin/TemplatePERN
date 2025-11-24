"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, MoreHorizontal, Eye, Edit, Trash2, Package } from "lucide-react";
import { toast } from "react-toastify";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { formatDate } from "@/utils/formDate";
import {
  getAllProductPurchases,
  deleteProductPurchase,
  updatePurchaseStatus,
  type ProductPurchase
} from "@/services/productPurchaseService";

const ProductPurchasesPage = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<ProductPurchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<ProductPurchase[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<ProductPurchase | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<ProductPurchase | null>(null);

  useEffect(() => {
    loadPurchases();
  }, []);

  useEffect(() => {
    filterPurchases();
  }, [searchTerm, purchases]);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const data = await getAllProductPurchases();
      setPurchases(data);
    } catch (error: any) {
      console.error("Error al cargar compras:", error);
      toast.error(error.response?.data?.message || error.message || "Error al cargar las compras de productos");
    } finally {
      setLoading(false);
    }
  };

  const filterPurchases = () => {
    if (!searchTerm.trim()) {
      setFilteredPurchases(purchases);
      return;
    }

    const filtered = purchases.filter((purchase) =>
      purchase.product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.purchase_history.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.product.type.type_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPurchases(filtered);
  };

  const handleViewDetails = (purchase: ProductPurchase) => {
    setSelectedPurchase(purchase);
    setShowDetails(true);
  };

  const handleDeleteClick = (purchase: ProductPurchase) => {
    setPurchaseToDelete(purchase);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!purchaseToDelete) return;

    try {
      await deleteProductPurchase(purchaseToDelete.product_purchase_id);
      toast.success("Compra eliminada exitosamente");
      loadPurchases();
    } catch (error: any) {
      console.error("Error al eliminar compra:", error);
      toast.error(error.response?.data?.message || error.message || "Error al eliminar la compra");
    } finally {
      setShowDeleteConfirm(false);
      setPurchaseToDelete(null);
    }
  };

  const handleStatusChange = async (purchase: ProductPurchase, newStatus: "processed" | "returned") => {
    try {
      await updatePurchaseStatus(purchase.product_purchase_id, newStatus);
      toast.success("Estado actualizado exitosamente");
      loadPurchases();
    } catch (error: any) {
      console.error("Error al actualizar estado:", error);
      toast.error(error.response?.data?.message || error.message || "Error al actualizar el estado");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      processed: { label: "Procesado", variant: "default" as const },
      returned: { label: "Devuelto", variant: "destructive" as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Cargando compras...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Compras de Productos</h1>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate('/admin/compras-productos/nuevo')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Compra
        </Button>
      </div>

      {/* Nota informativa */}
      <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: 'var(--stat-blue-bg)', borderColor: 'var(--stat-blue-text)' }}>
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 mt-0.5" style={{ color: 'var(--stat-blue-text)' }} />
          <div>
            <h3 className="font-medium" style={{ color: 'var(--stat-blue-text)' }}>Gestión de Inventario</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--stat-blue-text-secondary)' }}>
              Los productos nuevos se crean con stock en 0. Utiliza esta sección para registrar
              compras y agregar inventario inicial a tus productos.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por producto, descripción o tipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Purchases Table */}
      {filteredPurchases.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">
              {searchTerm ? "No se encontraron compras que coincidan con la búsqueda" : "No hay compras registradas"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: 'var(--card)' }}>
                    <th className="text-left p-4 font-medium text-muted-foreground">Producto</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Cantidad</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Precio Unitario</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Total</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Fecha Compra</th>
                    <th className="text-center p-4 font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase.product_purchase_id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{purchase.product.product_name}</div>
                          {purchase.product.supplier && (
                            <div className="text-sm text-muted-foreground">
                              {purchase.product.supplier.supplier_name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">{purchase.product.type.type_name}</td>
                      <td className="p-4">{purchase.quantity}</td>
                      <td className="p-4">{formatPriceCLP(purchase.purchase_price)}</td>
                      <td className="p-4 font-medium">{formatPriceCLP(purchase.total_price)}</td>
                      <td className="p-4">{getStatusBadge(purchase.purchase_status)}</td>
                      <td className="p-4">{formatDate(purchase.purchase_history.purchase_date)}</td>
                      <td className="p-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(purchase)}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4 text-blue-600" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {purchase.purchase_status === "processed" ? (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(purchase, "returned")}
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4 text-orange-600" />
                                Marcar como Devuelto
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(purchase, "processed")}
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4 text-green-600" />
                                Marcar como Procesado
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(purchase)}
                              className="cursor-pointer text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Compra</DialogTitle>
          </DialogHeader>
          {selectedPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Producto</label>
                  <p className="text-sm">{selectedPurchase.product.product_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <p className="text-sm">{selectedPurchase.product.type.type_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cantidad</label>
                  <p className="text-sm">{selectedPurchase.quantity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Precio Unitario</label>
                  <p className="text-sm">{formatPriceCLP(selectedPurchase.purchase_price)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Impuesto</label>
                  <p className="text-sm">{selectedPurchase.tax.tax_rate}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total</label>
                  <p className="text-sm font-medium">{formatPriceCLP(selectedPurchase.total_price)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estado</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedPurchase.purchase_status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha de Compra</label>
                  <p className="text-sm">{formatDate(selectedPurchase.purchase_history.purchase_date)}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descripción de la Compra</label>
                <p className="text-sm mt-1">{selectedPurchase.purchase_history.description}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetails(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <p>
            ¿Estás seguro de que deseas eliminar esta compra? Esta acción no se puede deshacer y
            afectará el stock del producto.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductPurchasesPage;
