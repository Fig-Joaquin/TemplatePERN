"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Edit, Trash2, Package, Plus } from "lucide-react"
import { fetchProducts, updateProduct, deleteProduct } from "../services/productService"
import { updateStockProduct } from "../services/stockProductService"
import type { Product } from "../types/interfaces"
import { formatDate } from "@/utils/formDate"
import { formatPriceCLP } from "@/utils/formatPriceCLP"
import { formatQuantity } from "@/utils/formatQuantity"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "react-toastify"
import { NumberInput } from "@/components/numberInput"
import api from "../utils/axiosConfig"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"

const ProductPage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<"edit" | "delete">()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productTypes, setProductTypes] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const navigate = useNavigate()

  // Edit form state
  const [editProductName, setEditProductName] = useState("")
  const [editSalePrice, setEditSalePrice] = useState(0)
  const [editStockQuantity, setEditStockQuantity] = useState(0)
  const [editDescription, setEditDescription] = useState("")
  const [editSelectedProductType, setEditSelectedProductType] = useState("")
  const [editSelectedSupplier, setEditSelectedSupplier] = useState("")
  const [editProfitMargin, setEditProfitMargin] = useState("")
  const [editLastPurchasePrice, setEditLastPurchasePrice] = useState(0)

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      try {
        const data = await fetchProducts()
        setProducts(data)
      } catch (error) {
        console.error(error)
        toast.error("Error al cargar los productos")
      } finally {
        setLoading(false)
      }
    }
    loadProducts()

    const fetchData = async () => {
      try {
        const typesResponse = await api.get("/productTypes")
        setProductTypes(typesResponse.data)
        const suppliersResponse = await api.get("/suppliers")
        setSuppliers(suppliersResponse.data)
      } catch (error) {
        toast.error("Error al cargar product types y suppliers")
      }
    }
    fetchData()
  }, [])

  const filteredProducts = products.filter((p) => p.product_name.toLowerCase().includes(searchTerm.toLowerCase()))

  const openModal = (type: "edit" | "delete", product: Product) => {
    setModalType(type)
    setSelectedProduct(product)
    if (type === "edit") {
      setEditProductName(product.product_name || "")
      setEditSalePrice(Number(product.sale_price))
      setEditStockQuantity(Number(product.stock?.quantity) || 0)
      setEditDescription(product.description || "")
      setEditSelectedProductType(product.type.product_type_id.toString())
      setEditSelectedSupplier(product.supplier?.supplier_id ? product.supplier.supplier_id.toString() : "none")
      setEditProfitMargin(product.profit_margin?.toString() || "")
      setEditLastPurchasePrice(Number(product.last_purchase_price) || 0)
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedProduct(null)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
    setLoading(true)
    try {
      const updatedProduct = {
        product_id: selectedProduct.product_id,
        product_name: editProductName,
        product_type_id: Number(editSelectedProductType),
        profit_margin: Number(editProfitMargin),
        last_purchase_price: Number(editLastPurchasePrice),
        sale_price: Number(editSalePrice),
        description: editDescription,
        product_quantity: Number(editStockQuantity),
      }

      // Update the stock using stock_product_id when available
      if (selectedProduct.stock?.stock_product_id) {
        const stockProduct = {
          quantity: Number(editStockQuantity)
        }

        await updateStockProduct(
          selectedProduct.stock.stock_product_id.toString(),
          stockProduct
        )
      } else {
        console.warn("Product stock doesn't have a stock_product_id")
        // If needed, you could create a new stock entry here
      }

      // Only add supplier_id if a valid supplier is selected
      if (editSelectedSupplier && editSelectedSupplier !== "none") {
        Object.assign(updatedProduct, { supplier_id: Number(editSelectedSupplier) });
      }

      await updateProduct(selectedProduct.product_id, updatedProduct)
      toast.success("Producto actualizado correctamente")
      const updatedProducts = await fetchProducts()
      setProducts(updatedProducts)
      closeModal()
    } catch (error: any) {
      console.log(error)
      toast.error(
        [error.response?.data?.message, error.response?.data?.errors?.map((e: any) => e.message).join(", ")]
          .filter(Boolean)
          .join(", ") || "Error al actualizar el producto",
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedProduct) return
    try {
      await deleteProduct(selectedProduct.product_id)
      toast.success("Producto eliminado correctamente")
      setProducts(products.filter((p) => p.product_id !== selectedProduct.product_id))
    } catch (error: any) {
      console.log(error)
      
      // Manejar específicamente el error 409 (conflicto)
      if (error.response?.status === 409) {
        const errorMessage = error.response?.data?.message || "No se puede eliminar el producto porque está siendo usado"
        const details = error.response?.data?.details
        
        let toastMessage = errorMessage
        if (details) {
          toastMessage += `. Total de referencias: ${details.total}`
        }
        
        toast.error(toastMessage, {
          autoClose: 5000, // 5 segundos para leer el mensaje completo
        })
      } else {
        // Para otros errores, mostrar el mensaje genérico
        toast.error(
          [error.response?.data?.message, error.response?.data?.errors?.map((e: any) => e.message).join(", ")]
            .filter(Boolean)
            .join(", ") || "Error al eliminar el producto",
        )
      }
    }
    closeModal()
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Package className="w-8 h-8" />
          Productos
        </h1>
        <Button onClick={() => navigate("/admin/productos/nuevo")} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Cargando productos...</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <motion.div
                key={product.product_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl text-foreground">{product.product_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-lg font-semibold text-primary">
                      Precio: {formatPriceCLP(Number(product.sale_price))}
                    </p>
                    {product.stock ? (
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          Stock: {formatQuantity(Number(product.stock.quantity))}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Actualizado: {product.stock.updated_at ? formatDate(product.stock.updated_at) : "N/A"}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Información de stock no disponible</p>
                    )}
                    <p className="text-foreground">
                      <span className="font-medium text-foreground">Proveedor:</span>{" "}
                      {product.supplier ? product.supplier.name : "No disponible"}
                    </p>
                    <div className="flex gap-2 pt-2">
                      <Badge variant="secondary">{product.type ? product.type.type_name : "Sin tipo"}</Badge>
                      <Badge variant="outline">
                        {product.type && product.type.category ? product.type.category.category_name : "Sin categoría"}
                      </Badge>
                    </div>
                    {product.description && (
                      <p className="text-sm text-muted-foreground border-t pt-3">{product.description}</p>
                    )}
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" size="sm" onClick={() => openModal("edit", product)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => openModal("delete", product)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="bg-card text-card-foreground max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modalType === "edit" ? "Editar Producto" : "Confirmar eliminación"}</DialogTitle>
          </DialogHeader>
          {modalType === "delete" ? (
            <>
              <p className="text-foreground">
                ¿Está seguro que desea eliminar el producto {selectedProduct?.product_name}?
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground"
                >
                  Eliminar
                </Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editProductName">Nombre del producto</Label>
                  <Input
                    id="editProductName"
                    type="text"
                    value={editProductName}
                    onChange={(e) => setEditProductName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editProductType">Tipo de Producto</Label>
                  <select
                    id="editProductType"
                    value={editSelectedProductType}
                    onChange={(e) => setEditSelectedProductType(e.target.value)}
                    className="w-full p-2 border border-input bg-background text-sm rounded-md"
                    required
                  >
                    <option value="">Seleccione un tipo</option>
                    {productTypes.map((type) => (
                      <option key={type.product_type_id} value={type.product_type_id}>
                        {type.type_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editSupplier">Proveedor</Label>
                  <select
                    id="editSupplier"
                    value={editSelectedSupplier}
                    onChange={(e) => setEditSelectedSupplier(e.target.value)}
                    className="w-full p-2 border border-input bg-background text-sm rounded-md"
                  >
                    <option value="none">Sin proveedor</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.supplier_id} value={supplier.supplier_id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editProfitMargin">Margen de ganancia (%)</Label>
                  <Input
                    id="editProfitMargin"
                    type="number"
                    value={editProfitMargin}
                    onChange={(e) => setEditProfitMargin(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLastPurchasePrice">Último precio de compra</Label>
                  <NumberInput
                    id="editLastPurchasePrice"
                    value={editLastPurchasePrice}
                    onChange={(value) => setEditLastPurchasePrice(value)}
                    min={1}
                    required
                    isPrice
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editSalePrice">Precio de venta</Label>
                  <NumberInput
                    id="editSalePrice"
                    value={editSalePrice}
                    onChange={(value) => setEditSalePrice(value)}
                    min={1}
                    required
                    isPrice
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editStockQuantity">Cantidad de Producto</Label>
                  <NumberInput
                    id="editStockQuantity"
                    value={editStockQuantity}
                    onChange={(value) => setEditStockQuantity(value)}
                    min={1}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editDescription">Descripción</Label>
                  <Input
                    id="editDescription"
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary text-primary-foreground">
                  Guardar cambios
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default ProductPage

