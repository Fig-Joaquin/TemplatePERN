"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "react-toastify"
import { createProduct } from "../services/productService"
import api from "../utils/axiosConfig"
import { NumberInput } from "@/components/numberInput"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Package } from "lucide-react"

const ProductCreatePage = () => {
  const [productName, setProductName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedProductType, setSelectedProductType] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [profitMargin, setProfitMargin] = useState("")
  const [lastPurchasePrice, setLastPurchasePrice] = useState(0)
  const [categories, setCategories] = useState<any[]>([])
  const [productTypes, setProductTypes] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesResponse = await api.get("/productCategories")
        setCategories(categoriesResponse.data)
        const typesResponse = await api.get("/productTypes")
        setProductTypes(typesResponse.data)
        const suppliersResponse = await api.get("/suppliers")
        setSuppliers(suppliersResponse.data)
      } catch (error: any) {
        toast.error(error.response?.data?.message || error.message || "Error al cargar categorías, tipos de producto y proveedores")
      }
    }
    fetchData()
  }, [])

  // Filtrar los tipos de producto según la categoría seleccionada
  const filteredProductTypes = selectedCategory
    ? productTypes.filter(
      (type) =>
        type.category.product_category_id.toString() === selectedCategory
    )
    : [] // Retornamos array vacío si no hay categoría seleccionada

  // Función para calcular el precio con margen (solo para mostrar)
  const calculatePriceWithMargin = () => {
    const purchasePrice = Number(lastPurchasePrice);
    const margin = Number(profitMargin) / 100;
    return purchasePrice * (1 + margin);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validar que se haya seleccionado una categoría y tipo de producto
    if (!selectedCategory) {
      toast.error("Debe seleccionar una categoría")
      setLoading(false)
      return
    }

    if (!selectedProductType) {
      toast.error("Debe seleccionar un tipo de producto")
      setLoading(false)
      return
    }

    if (
      Number(lastPurchasePrice) === 0
    ) {
      toast.error(
        "El precio de compra debe ser mayor a 0"
      )
      setLoading(false)
      return
    }

    try {
      const newProduct = {
        product_name: productName,
        product_type_id: Number(selectedProductType),
        profit_margin: Number(profitMargin),
        last_purchase_price: Number(lastPurchasePrice),
        sale_price: Number(lastPurchasePrice), // Usar el mismo valor que lastPurchasePrice
        description: description.trim() || undefined, // Solo enviar descripción si no está vacía
        product_quantity: 0, // Stock inicial en 0
      }

      // Only add supplier_id if one is selected and not "none"
      if (selectedSupplier && selectedSupplier !== "none") {
        Object.assign(newProduct, { supplier_id: Number(selectedSupplier) });
      }
      // No need to explicitly set supplier_id to null, just omit it

      await createProduct(newProduct)

      // Ofrecer ir directamente a compras
      toast.success("Producto creado exitosamente", {
        autoClose: 8000,
      })

      // Mostrar opción para ir a compras
      setTimeout(() => {
        const goToCompras = window.confirm(
          "¿Deseas ir ahora a 'Compras de Productos' para agregar stock inicial a este producto?"
        )
        if (goToCompras) {
          navigate("/admin/compras-productos")
        } else {
          navigate("/admin/productos")
        }
      }, 1000)
    } catch (error: any) {
      console.log(error)
      toast.error(
        [
          error.response?.data?.message,
          error.response?.data?.errors?.map((e: any) => e.message).join(", "),
        ]
          .filter(Boolean)
          .join(", ") || "Error al crear el producto"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold text-primary flex items-center gap-2 mb-8">
        <Package className="w-8 h-8" />
        Crear Nuevo Producto
      </h1>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna izquierda */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">
                      Nombre del producto
                    </Label>
                    <Input
                      id="productName"
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      required
                      placeholder="Ingrese el nombre del producto"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productCategory">Categoría</Label>
                    <Select
                      value={selectedCategory}
                      onValueChange={(value) => {
                        setSelectedCategory(value)
                        // Reiniciamos el tipo de producto al cambiar la categoría
                        setSelectedProductType("")
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.product_category_id}
                            value={category.product_category_id.toString()}
                          >
                            {category.category_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productType">Tipo de Producto</Label>
                    <Select
                      value={selectedProductType}
                      onValueChange={setSelectedProductType}
                      disabled={!selectedCategory} // Deshabilitar si no hay categoría seleccionada
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            !selectedCategory
                              ? "Primero seleccione una categoría"
                              : "Seleccione un tipo"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProductTypes.length > 0 ? (
                          filteredProductTypes.map((type) => (
                            <SelectItem
                              key={type.product_type_id}
                              value={type.product_type_id.toString()}
                            >
                              {type.type_name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            {!selectedCategory
                              ? "Seleccione una categoría primero"
                              : "No hay tipos disponibles para esta categoría"
                            }
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Proveedor (Opcional)</Label>
                    <Select
                      value={selectedSupplier}
                      onValueChange={setSelectedSupplier}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione un proveedor (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin proveedor</SelectItem>
                        {suppliers.map((supplier) => (
                          <SelectItem
                            key={supplier.supplier_id}
                            value={supplier.supplier_id.toString()}
                          >
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción (Opcional)</Label>
                    <Input
                      id="description"
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descripción del producto (opcional)"
                      className="w-full"
                    />
                  </div>
                </div>
                {/* Columna derecha */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lastPurchasePrice">
                      Precio compra de producto
                    </Label>
                    <NumberInput
                      id="lastPurchasePrice"
                      value={Number(lastPurchasePrice)}
                      onChange={(value) => setLastPurchasePrice(value)}
                      min={0}
                      required
                      isPrice
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profitMargin">
                      Margen de ganancia (%)
                    </Label>
                    <Input
                      id="profitMargin"
                      type="number"
                      value={profitMargin}
                      onChange={(e) => setProfitMargin(e.target.value)}
                      required
                      placeholder="Ej: 25"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salePrice">Precio neto (con margen)</Label>
                    <div className="relative">
                      <NumberInput
                        id="salePrice"
                        value={calculatePriceWithMargin()}
                        onChange={() => {/* No hacemos nada, es solo visual */ }}
                        min={0}
                        isPrice
                        className="w-full"
                        disabled={true} // Hacemos que el campo sea de solo lectura
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        Precio de venta calculado con margen del {profitMargin}%
                      </div>
                    </div>
                  </div>

                  {/* Nota sobre el stock */}
                  <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--stat-blue-bg)', borderColor: 'var(--stat-blue-text)' }}>
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 mt-0.5" style={{ color: 'var(--stat-blue-text)' }} />
                      <div>
                        <h4 className="font-medium" style={{ color: 'var(--stat-blue-text)' }}>Stock Inicial</h4>
                        <p className="text-sm mt-1" style={{ color: 'var(--stat-blue-text-secondary)' }}>
                          El producto se creará con stock en 0. Para agregar inventario inicial,
                          ve a <strong>"Compras de Productos"</strong> después de crear el producto.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/productos")}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⌛</span>
                      Creando...
                    </>
                  ) : (
                    "Crear Producto"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default ProductCreatePage
