"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "react-toastify"
import { createProduct } from "../services/productService"
import api from "../utils/axiosConfig"
import { NumberInput } from "@/components/numberInput"

const ProductCreatePage = () => {
  const [productName, setProductName] = useState("")
  const [salePrice, setSalePrice] = useState(Number)
  const [stockQuantity, setStockQuantity] = useState(Number)
  const [description, setDescription] = useState("")
  const [selectedProductType, setSelectedProductType] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [profitMargin, setProfitMargin] = useState("")
  const [lastPurchasePrice, setLastPurchasePrice] = useState(Number)
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
        toast.error("Error al cargar product types y suppliers")
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validar que los valores numéricos sean mayores a 0
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
    <div className="container mx-auto p-6">
      <Card className="bg-white">
        <CardHeader>
          <h2 className="text-2xl font-bold">Crear Nuevo Producto</h2>
        </CardHeader>
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
              <select
                id="productType"
                value={selectedProductType}
                onChange={(e) => setSelectedProductType(e.target.value)}
                className="border rounded p-2 w-full"
                required
              >
                <option value="">Seleccione un tipo</option>
                {productTypes.map((type) => (
                  <option key={type.id} value={type.product_type_id}>
                    {type.type_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Proveedor</Label>
              <select
                id="supplier"
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="border rounded p-2 w-full"
                required
              >
                <option value="">Seleccione un proveedor</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.supplier_id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
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
                min={1}
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
                min={1}
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

