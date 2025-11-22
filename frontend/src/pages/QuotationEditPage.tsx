"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { fetchQuotationById, updateQuotation } from "@/services/quotationService"
import {
    getWorkProductDetailsByQuotationId,
    createWorkProductDetail,
    deleteWorkProductDetail,
} from "@/services/workProductDetail"
import { fetchVehicles } from "@/services/vehicleService"
import { fetchProducts } from "@/services/productService"
import { getTaxById } from "@/services/taxService"
import { Button } from "@/components/ui/button"
import { NumberInput } from "@/components/numberInput"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatPriceCLP } from "@/utils/formatPriceCLP"
import { toast } from "react-toastify"
import { motion } from "framer-motion"
import { Save, ArrowLeft, FileText, Plus, Package } from "lucide-react"
import type { Vehicle, Quotation, WorkProductDetail, Product } from "@/types/interfaces"

// Interface for selected products (similar to quotationCreatePage)
interface SelectedProduct {
    productId: number
    quantity: number
    laborPrice: number
    workProductDetailId?: number
    originalSalePrice?: number
    originalQuantity?: number // Añadimos esta propiedad
}

const fetchTax = async () => {
    try {
        const res = await getTaxById(1)
        const TAX_RATE = res.tax_rate / 100
        return TAX_RATE
    } catch (error) {
        toast.error("Error al cargar stock de productos")
    }
}

export default function EditQuotationPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // Form state
    const [description, setDescription] = useState("")
    const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null)
    const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending")
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [productDetails, setProductDetails] = useState<WorkProductDetail[]>([])
    const [, setOriginalQuotation] = useState<Quotation | null>(null)
    const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null)

    // New states for product management
    const [products, setProducts] = useState<Product[]>([])
    const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
    const [showProductModal, setShowProductModal] = useState(false)
    const [taxRate, setTaxRate] = useState<number>(0)

    // Track which details should be deleted
    const [detailsToDelete, setDetailsToDelete] = useState<number[]>([])

    // Nuevo estado para manejar productos temporales en el modal
    const [tempSelectedProducts, setTempSelectedProducts] = useState<SelectedProduct[]>([])

    // Load quotation data
    useEffect(() => {
        const fetchData = async () => {
            if (!id) return

            try {
                setLoading(true)

                // Fetch the quotation first to get vehicle_id
                const quotationData = await fetchQuotationById(Number.parseInt(id))
                setOriginalQuotation(quotationData)

                // Set form fields
                setDescription(quotationData.description || "")
                setStatus(quotationData.quotation_status as "pending" | "approved" | "rejected")

                const vehicleId = quotationData.vehicle_id || (quotationData.vehicle && quotationData.vehicle.vehicle_id)

                if (!vehicleId) {
                    toast.error("No se encontró un vehículo asociado a esta cotización")
                    return
                }

                setSelectedVehicleId(vehicleId)

                // Fetch vehicles for dropdown
                const vehiclesData = await fetchVehicles()
                setVehicles(vehiclesData)

                // Find current vehicle in the vehicles list
                const vehicle = vehiclesData.find((v) => v.vehicle_id === vehicleId)
                if (vehicle) {
                    setCurrentVehicle(vehicle)
                }

                // Fetch product details
                const details = await getWorkProductDetailsByQuotationId(Number.parseInt(id))
                setProductDetails(details)

                // Map product details to selected products format
                const initialSelectedProducts = details.map((detail: WorkProductDetail) => ({
                    productId: detail.product_id || 0,
                    quantity: detail.quantity,
                    laborPrice: detail.labor_price || 0,
                    workProductDetailId: detail.work_product_detail_id,
                    originalSalePrice: detail.product?.sale_price || 0,
                    originalQuantity: detail.quantity, // Guardamos la cantidad original
                }))
                setSelectedProducts(initialSelectedProducts)

                // Fetch products (no need for stock data in quotations)
                const productsData = await fetchProducts()
                setProducts(productsData)

                console.log("Product details:", details)

                fetchTax().then((rate) => {
                    if (rate !== undefined) {
                        setTaxRate(rate)
                    }
                })
            } catch (error: any) {
                console.error("Error loading quotation:", error)
                toast.error(error.response?.data?.message || error.message || "Error al cargar la cotización")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id])

    // Product management functions updated for stock handling
    const handleProductChange = (productId: number, quantity: number, laborPrice: number) => {
        // No stock validation for quotations - they are estimates, not actual product consumption
        setSelectedProducts((prevSelectedProducts) => {
            const existingProduct = prevSelectedProducts.find((p) => p.productId === productId)
            if (existingProduct) {
                return prevSelectedProducts.map((p) => (p.productId === productId ? { ...p, quantity, laborPrice } : p))
            } else {
                return [...prevSelectedProducts, { productId, quantity, laborPrice }]
            }
        })
    }

    // Función mejorada para eliminar productos
    const handleRemoveProduct = (productId: number) => {
        const productToRemove = selectedProducts.find((p) => p.productId === productId)

        // Si el producto tiene un ID de detalle existente, marcarlo para eliminación
        if (productToRemove?.workProductDetailId) {
            setDetailsToDelete((prev) => [...prev, productToRemove.workProductDetailId!])
        }

        // Eliminar el producto de la lista de seleccionados
        setSelectedProducts((prev) => prev.filter((p) => p.productId !== productId))
    }

    // Función que utiliza el margen del producto (profit_margin) en los cálculos
    const calculateTotalWithMargin = (price: number, quantity: number, profitMargin: number) => {
        return price * quantity * (1 + profitMargin / 100)
    }

    const totalProductPrice = selectedProducts.reduce((total, { productId, quantity }) => {
        const product = products.find((p) => p.product_id === Number(productId))
        return (
            total +
            (product ? calculateTotalWithMargin(Number(product.sale_price), quantity, Number(product.profit_margin)) : 0)
        )
    }, 0)

    const totalLaborPrice = selectedProducts.reduce((total, { laborPrice }) => {
        return total + (Number(laborPrice) || 0) // Convertir a número y usar 0 si es inválido
    }, 0)

    const subtotalWithoutTax = totalProductPrice + totalLaborPrice
    const taxAmount = subtotalWithoutTax * taxRate
    const totalPrice = subtotalWithoutTax + taxAmount

    // Add debugging to inspect values
    console.log({
        totalProductPrice,
        totalLaborPrice,
        subtotalWithoutTax,
        taxRate,
        taxAmount,
        totalPrice,
    })

    // No stock validation for quotations
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            setSubmitting(true)

            // Create updated quotation object
            console.log("Updating quotation with data:", {
                description,
                status,
                selectedVehicleId,
                totalPrice,
            })
            const updatedQuotation: Partial<Quotation> = {
                description,
                quotation_status: status,
                vehicle_id: selectedVehicleId || undefined,
                total_price: Math.trunc(totalPrice),
            }

            // Update the quotation
            if (!id) {
                toast.error("ID de cotización no encontrado")
                return
            }
            await updateQuotation(Number.parseInt(id), updatedQuotation)

            // Handle product details changes

            // 1. Delete details that were removed
            if (detailsToDelete.length > 0) {
                await Promise.all(detailsToDelete.map((detailId) => deleteWorkProductDetail(detailId)))
            }

            // 2. Update or create product details
            for (const selectedProduct of selectedProducts) {
                const { productId, quantity, laborPrice, workProductDetailId } = selectedProduct
                const product = products.find((p) => p.product_id === Number(productId))

                if (!product) continue

                // If it already has a work_product_detail_id, it's an existing detail that needs to be updated
                // Otherwise, it's a new detail that needs to be created
                if (workProductDetailId) {
                    // Find the original detail
                    const originalDetail = productDetails.find((d) => d.work_product_detail_id === workProductDetailId)

                    // If quantity or laborPrice changed, update the detail
                    if (originalDetail && (originalDetail.quantity !== quantity || originalDetail.labor_price !== laborPrice)) {
                        await deleteWorkProductDetail(workProductDetailId)

                        // Create a new detail with updated values - FIX: Just store base sale price
                        await createWorkProductDetail({
                            quotation_id: Number.parseInt(id),
                            product_id: productId,
                            quantity,
                            labor_price: laborPrice,
                            tax_id: 1,
                            sale_price: calculateTotalWithMargin(
                                Number(product.sale_price),
                                1, // Use 1 for quantity here as the quantity is separate
                                Number(product.profit_margin),
                            ), // Apply the profit margin to sale_price
                            discount: 0,
                        })
                    }
                } else {
                    // Create a new detail - FIX: Just store base sale price
                    await createWorkProductDetail({
                        quotation_id: Number.parseInt(id),
                        product_id: productId,
                        quantity,
                        labor_price: laborPrice,
                        tax_id: 1,
                        sale_price: calculateTotalWithMargin(
                            Number(product.sale_price),
                            1, // Use 1 for quantity here as the quantity is separate
                            Number(product.profit_margin),
                        ), // Apply the profit margin to sale_price
                        discount: 0,
                    })
                }
            }

            toast.success("Cotización actualizada exitosamente")
            navigate("/admin/cotizaciones")
        } catch (error: any) {
            console.error("Error updating quotation:", error)
            toast.error(error.response?.data?.message || error.message || "Error al actualizar la cotización")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-lg text-muted-foreground">Cargando cotización...</p>
            </div>
        )
    }

    // Modificar para abrir el modal y preparar productos temporales
    const handleOpenProductModal = () => {
        // Inicializar productos temporales con los actuales
        setTempSelectedProducts([...selectedProducts])
        setShowProductModal(true)
    }

    // Update temp product management (stock validation removed for quotations)
    const handleTempProductChange = (productId: number, quantity: number, laborPrice: number) => {

        setTempSelectedProducts((prevSelectedProducts) => {
            const existingProduct = prevSelectedProducts.find((p) => p.productId === productId)
            if (existingProduct) {
                return prevSelectedProducts.map((p) => (p.productId === productId ? { ...p, quantity, laborPrice } : p))
            } else {
                return [...prevSelectedProducts, { productId, quantity, laborPrice }]
            }
        })
    }

    // Función para eliminar productos temporalmente en el modal
    const handleTempRemoveProduct = (productId: number) => {
        setTempSelectedProducts((prev) => prev.filter((p) => p.productId !== productId))
    }

    // Update modal close handler - no stock validation for quotations
    const handleModalClose = (save: boolean) => {
        if (save) {
            // No stock validation needed for quotations since they are estimates
            setSelectedProducts(tempSelectedProducts)
        }
        setShowProductModal(false)
    }

    return (
        <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => navigate("/admin/cotizaciones")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                        <FileText className="w-8 h-8" />
                        Editar Cotización #{id}
                    </h1>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información General</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="vehicle">Vehículo</Label>
                                {currentVehicle && (
                                    <div className="mb-2 p-3 bg-muted rounded-md">
                                        <p className="font-medium">Vehículo actual:</p>
                                        <p>
                                            {currentVehicle.license_plate} - {currentVehicle.model?.brand?.brand_name}{" "}
                                            {currentVehicle.model?.model_name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {currentVehicle.owner ? currentVehicle.owner.name : currentVehicle.company?.name}
                                        </p>
                                    </div>
                                )}
                                <Select
                                    value={selectedVehicleId ? selectedVehicleId.toString() : ""}
                                    onValueChange={(value) => setSelectedVehicleId(Number.parseInt(value))}
                                    disabled={submitting}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar vehículo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vehicles
                                            .filter((vehicle) => vehicle.vehicle_id !== undefined)
                                            .map((vehicle) => (
                                                <SelectItem key={vehicle.vehicle_id} value={vehicle.vehicle_id!.toString()}>
                                                    {vehicle.license_plate} - {vehicle.model?.brand?.brand_name} {vehicle.model?.model_name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Estado</Label>
                                <Select
                                    value={status}
                                    onValueChange={(value: "pending" | "approved" | "rejected") => setStatus(value)}
                                    disabled={submitting}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pendiente</SelectItem>
                                        <SelectItem value="approved">Aprobada</SelectItem>
                                        <SelectItem value="rejected">Rechazada</SelectItem>
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
                                    placeholder="Descripción de la cotización"
                                    disabled={submitting}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Products section - updated to allow modifications */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-primary" />
                                Repuestos Seleccionados
                            </CardTitle>
                            <Button
                                type="button" // Importante: esto previene que envíe el formulario
                                onClick={handleOpenProductModal}
                                variant="outline"
                                className="hover:bg-primary hover:text-primary-foreground transition-colors"
                                disabled={submitting}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Añadir Repuesto
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[300px] pr-4">
                                <ul className="space-y-3">
                                    {selectedProducts.map(({ productId, quantity, laborPrice, originalSalePrice, workProductDetailId }) => {
                                        const product = products.find((p) => p.product_id === Number(productId))
                                        // No need to find stock product for quotations

                                        // Calculate the unit price for display
                                        const unitPrice =
                                            originalSalePrice ||
                                            (product
                                                ? calculateTotalWithMargin(Number(product.sale_price), 1, Number(product.profit_margin))
                                                : 0)

                                        // Calculate if this is an existing product
                                        const isExistingProduct = workProductDetailId !== undefined

                                        return (
                                            <li
                                                key={productId}
                                                className={`flex items-center justify-between p-3 rounded-lg border hover:bg-accent/5 transition-colors ${isExistingProduct ? "border-primary/20" : ""
                                                    }`}
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{product?.product_name}</p>
                                                        {isExistingProduct && (
                                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                                Existente
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500">Margen: {product?.profit_margin}%</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Precio: {formatPriceCLP(unitPrice)}
                                                        {/* No stock warnings for quotations since they are estimates */}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex flex-col items-end">
                                                        <Label htmlFor={`quantity-${productId}`} className="text-xs">
                                                            Cantidad
                                                        </Label>
                                                        <NumberInput
                                                            id={`quantity-${productId}`}
                                                            value={quantity}
                                                            onChange={(newValue) => handleProductChange(productId, newValue, laborPrice)}
                                                            min={1}
                                                            className="w-20"
                                                            disabled={submitting}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <Label htmlFor={`labor-${productId}`} className="text-xs">
                                                            Mano de obra
                                                        </Label>
                                                        <NumberInput
                                                            id={`labor-${productId}`}
                                                            value={laborPrice}
                                                            onChange={(newValue) => handleProductChange(productId, quantity, newValue)}
                                                            min={0}
                                                            className="w-24"
                                                            isPrice
                                                            disabled={submitting}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col justify-end h-full">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleRemoveProduct(productId)}
                                                            disabled={submitting}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                                                <path d="M3 6h18"></path>
                                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                                            </svg>
                                                            <span className="sr-only">Eliminar</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </li>
                                        )
                                    })}
                                    {selectedProducts.length === 0 && (
                                        <li className="text-center py-10 text-gray-500">No hay productos en esta cotización</li>
                                    )}
                                </ul>
                            </ScrollArea>

                            {/* Sección de totales */}
                            <div className="mt-6 space-y-2 border-t pt-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="space-y-2">
                                        <div className="flex justify-between p-2 rounded bg-accent/5">
                                            <span>Subtotal Productos:</span>
                                            <span className="font-medium">{formatPriceCLP(totalProductPrice)}</span>
                                        </div>
                                        <div className="flex justify-between p-2 rounded bg-accent/5">
                                            <span>Total Mano de Obra:</span>
                                            <span className="font-medium">{formatPriceCLP(totalLaborPrice)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between p-2 rounded bg-accent/5">
                                            <span>IVA (19%):</span>
                                            <span className="font-medium">{formatPriceCLP(taxAmount)}</span>
                                        </div>
                                        <div className="flex justify-between p-2 rounded bg-primary/10 font-bold">
                                            <span>Total Final:</span>
                                            <span>{formatPriceCLP(totalPrice)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => navigate("/admin/cotizaciones")} disabled={submitting}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={submitting || !selectedVehicleId || selectedProducts.length === 0}
                        className="gap-2"
                    >
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

            {/* Product selection dialog - modificado para usar estado temporal */}
            <Dialog
                open={showProductModal}
                onOpenChange={(open) => {
                    if (!open) handleModalClose(false)
                }}
            >
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Seleccionar Repuestos
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Command>
                            <CommandInput placeholder="Buscar repuestos..." className="h-9" />
                            <CommandList>
                                <CommandEmpty>No se encontraron repuestos.</CommandEmpty>

                                {/* Available products section */}
                                <CommandGroup heading="Productos disponibles">
                                    <ScrollArea className="h-[200px]">
                                        {products
                                            .map((product) => {
                                                const selectedProduct = tempSelectedProducts.find((sp) => sp.productId === product.product_id)
                                                const isSelected = !!selectedProduct

                                                return (
                                                    <CommandItem
                                                        key={product.product_id}
                                                        className="flex items-center justify-between p-2 cursor-pointer hover:bg-accent/5"
                                                        onSelect={() => {
                                                            // onSelect receives the value, not an event object
                                                            if (!isSelected) {
                                                                handleTempProductChange(product.product_id, 1, 0)
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-center space-x-4 flex-1">
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        handleTempProductChange(product.product_id, 1, 0)
                                                                    } else {
                                                                        handleTempRemoveProduct(product.product_id)
                                                                    }
                                                                }}
                                                            />
                                                            <div className="flex-1">
                                                                <p className="font-medium">{product.product_name}</p>
                                                                <p className="text-xs text-gray-500">Margen: {product.profit_margin}%</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Precio: {formatPriceCLP(Number(product.sale_price))}
                                                                    {/* No stock information for quotations */}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </CommandItem>
                                                )
                                            })}
                                    </ScrollArea>
                                </CommandGroup>
                            </CommandList>
                        </Command>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => handleModalClose(false)}>
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={() => handleModalClose(true)}
                                className="bg-primary text-primary-foreground"
                            >
                                Aplicar Cambios
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}