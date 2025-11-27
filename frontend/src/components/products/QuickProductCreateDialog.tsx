import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NumberInput } from "@/components/numberInput"
import { toast } from "react-toastify"
import api from "@/utils/axiosConfig"
import { createProduct } from "@/services/productService"
import { Package, Tag, DollarSign, Percent, Calculator, Layers, Type } from "lucide-react"
import type { Product } from "@/types/interfaces"

interface QuickProductCreateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onProductCreated: (product: Product) => void
}

export function QuickProductCreateDialog({
    open,
    onOpenChange,
    onProductCreated,
}: QuickProductCreateDialogProps) {
    const [productName, setProductName] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("")
    const [selectedProductType, setSelectedProductType] = useState("")
    const [profitMargin, setProfitMargin] = useState("")
    const [lastPurchasePrice, setLastPurchasePrice] = useState(0)
    const [loading, setLoading] = useState(false)

    const [categories, setCategories] = useState<any[]>([])
    const [productTypes, setProductTypes] = useState<any[]>([])

    useEffect(() => {
        if (open) {
            const fetchData = async () => {
                try {
                    const [categoriesRes, typesRes] = await Promise.all([
                        api.get("/productCategories"),
                        api.get("/productTypes"),
                    ])
                    setCategories(categoriesRes.data)
                    setProductTypes(typesRes.data)
                } catch (error) {
                    console.error("Error fetching data:", error)
                    toast.error("Error al cargar datos necesarios")
                }
            }
            fetchData()
        }
    }, [open])

    const filteredProductTypes = selectedCategory
        ? productTypes.filter(
            (type) => type.category.product_category_id.toString() === selectedCategory
        )
        : []

    const calculatePriceWithMargin = () => {
        const purchasePrice = Number(lastPurchasePrice)
        const margin = Number(profitMargin) / 100
        return purchasePrice * (1 + margin)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (!selectedCategory || !selectedProductType) {
            toast.error("Debe seleccionar categoría y tipo")
            setLoading(false)
            return
        }

        if (Number(lastPurchasePrice) <= 0) {
            toast.error("El precio de compra debe ser mayor a 0")
            setLoading(false)
            return
        }

        try {
            const newProduct = {
                product_name: productName,
                product_type_id: Number(selectedProductType),
                profit_margin: Number(profitMargin),
                last_purchase_price: Number(lastPurchasePrice),
                sale_price: Number(lastPurchasePrice), // Base price, margin is applied later in calculations
                product_quantity: 0,
            }

            const createdProduct = await createProduct(newProduct)

            // Ensure numeric values are preserved/present for the callback
            const finalProduct: Product = {
                ...createdProduct,
                profit_margin: Number(profitMargin),
                sale_price: Number(lastPurchasePrice),
                last_purchase_price: Number(lastPurchasePrice),
                product_name: productName, // Ensure name is correct
            }

            toast.success("Producto creado exitosamente")
            onProductCreated(finalProduct)
            onOpenChange(false)

            // Reset form
            setProductName("")
            setSelectedCategory("")
            setSelectedProductType("")
            setProfitMargin("")
            setLastPurchasePrice(0)
        } catch (error: any) {
            console.error(error)
            toast.error(error.response?.data?.message || "Error al crear el producto")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="flex items-center gap-2 text-xl text-primary">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Package className="w-6 h-6" />
                        </div>
                        Crear Nuevo Producto Rápido
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Sección: Información Básica */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            Información Básica
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="quick-productName">Nombre del producto</Label>
                                <div className="relative">
                                    <Package className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="quick-productName"
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                        required
                                        placeholder="Ej: Filtro de Aceite Bosch"
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Categoría</Label>
                                <div className="relative">
                                    <Layers className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                    <Select
                                        value={selectedCategory}
                                        onValueChange={(value) => {
                                            setSelectedCategory(value)
                                            setSelectedProductType("")
                                        }}
                                    >
                                        <SelectTrigger className="pl-9">
                                            <SelectValue placeholder="Seleccionar categoría" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.product_category_id} value={c.product_category_id.toString()}>
                                                    {c.category_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Tipo de Producto</Label>
                                <div className="relative">
                                    <Type className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                    <Select
                                        value={selectedProductType}
                                        onValueChange={setSelectedProductType}
                                        disabled={!selectedCategory}
                                    >
                                        <SelectTrigger className="pl-9">
                                            <SelectValue placeholder="Seleccionar tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredProductTypes.map((t) => (
                                                <SelectItem key={t.product_type_id} value={t.product_type_id.toString()}>
                                                    {t.type_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t my-4"></div>

                    {/* Sección: Precios y Rentabilidad */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                            <Calculator className="w-4 h-4" />
                            Precios y Rentabilidad
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="space-y-2">
                                <Label htmlFor="quick-purchasePrice">Precio Compra (Neto)</Label>
                                <div className="relative">
                                    <div className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground flex items-center justify-center">
                                        <DollarSign className="h-4 w-4" />
                                    </div>
                                    <NumberInput
                                        id="quick-purchasePrice"
                                        value={lastPurchasePrice}
                                        onChange={setLastPurchasePrice}
                                        min={0}
                                        isPrice
                                        required
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="quick-margin">Margen de Ganancia</Label>
                                <div className="relative">
                                    <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="quick-margin"
                                        type="number"
                                        value={profitMargin}
                                        onChange={(e) => setProfitMargin(e.target.value)}
                                        required
                                        placeholder="30"
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-primary font-semibold">Precio Venta Estimado</Label>
                                <div className="h-10 px-3 py-2 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-between font-bold text-primary">
                                    <span>
                                        {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(
                                            calculatePriceWithMargin()
                                        )}
                                    </span>
                                    <span className="text-xs font-normal opacity-70">+IVA</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t mt-6">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="gap-2">
                            {loading ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></span>
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <Package className="w-4 h-4" />
                                    Crear Producto
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
