"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "react-toastify"
import { createProduct } from "../services/productService"
import api from "../utils/axiosConfig"
import { NumberInput } from "@/components/numberInput"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package } from "lucide-react"

const ProductCreatePage = () => {
  const [productName, setProductName] = useState("")
  const [salePrice, setSalePrice] = useState(0)
  const [stockQuantity, setStockQuantity] = useState(0)
  const [description, setDescription] = useState("")
  const [selectedProductType, setSelectedProductType] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [profitMargin, setProfitMargin] = useState("")
  const [lastPurchasePrice, setLastPurchasePrice] = useState(0)
  const [productTypes, setProductTypes] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const typesResponse = await api.get("/productTypes")
        setProductTypes(typesResponse.data)
        const suppliersResponse = await api.get("/suppliers")
        setSuppliers(suppliersResponse.data)
      } catch (error) {
        toast.error("Error al cargar tipos de producto y proveedores")
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (Number(salePrice) === 0 || Number(lastPurchasePrice) === 0 || Number(stockQuantity) === 0) {
      toast.error("El precio de venta, último precio de compra y cantidad deben ser mayores a 0")
      setLoading(false)
      return
    }

    try {
      const newProduct = {
        product_name: productName,
        product_type_id: Number(selectedProductType),
        supplier_id: Number(selectedSupplier),
        profit_margin: Number(profitMargin),
        last_purchase_price: Number(lastPurchasePrice),
        sale_price: Number(salePrice),
        description,
        product_quantity: Number(stockQuantity),
      }
      await createProduct(newProduct)
      toast.success("Producto creado exitosamente")
      navigate("/admin/productos")
    } catch (error: any) {
      console.log(error)
      toast.error(
        [error.response?.data?.message, error.response?.data?.errors?.map((e: any) => e.message).join(", ")]
          .filter(Boolean)
          .join(", ") || "Error al crear el producto",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
        <Package className="w-8 h-8" />
        Crear Nuevo Producto
      </h1>
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="productName">Nombre del producto</Label>
              <Input
                id="productName"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productType">Tipo de Producto</Label>
              <Select value={selectedProductType} onValueChange={setSelectedProductType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map((type) => (
                    <SelectItem key={type.product_type_id} value={type.product_type_id.toString()}>
                      {type.type_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Proveedor</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.supplier_id} value={supplier.supplier_id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profitMargin">Margen de ganancia (%)</Label>
              <Input
                id="profitMargin"
                type="number"
                value={profitMargin}
                onChange={(e) => setProfitMargin(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastPurchasePrice">Último precio de compra</Label>
              <NumberInput
                id="lastPurchasePrice"
                value={Number(lastPurchasePrice)}
                onChange={(value) => setLastPurchasePrice(value)}
                min={0}
                required
                isPrice
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">Precio de venta</Label>
              <NumberInput
                id="salePrice"
                value={Number(salePrice)}
                onChange={(value) => setSalePrice(value)}
                min={0}
                required
                isPrice
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Cantidad de Producto</Label>
              <NumberInput
                id="stockQuantity"
                value={Number(stockQuantity)}
                onChange={(value) => setStockQuantity(value)}
                min={1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creando..." : "Crear Producto"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProductCreatePage

