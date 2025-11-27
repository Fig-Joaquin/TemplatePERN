"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Percent, Save, X } from "lucide-react"
import { toast } from "react-toastify"
import { getTaxes, getTaxById, createTax, updateTax, deleteTax } from "@/services/taxService"
import type { Tax } from "@/types/interfaces"

export default function TaxesPage() {
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [taxToDelete, setTaxToDelete] = useState<Tax | null>(null)
  const [editingTax, setEditingTax] = useState<Tax | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [taxRate, setTaxRate] = useState<number>(0)

  // Helper function to format tax rate display
  // Examples: 19.00 → "19", 19.50 → "19.5", 19.25 → "19.25"
  const formatTaxRate = (rate: number): string => {
    // Convert to number in case it comes as string
    const numRate = Number(rate)

    // If the number has no decimals or ends in .00, show as integer
    if (numRate % 1 === 0) {
      return numRate.toString()
    }

    // Otherwise show with up to 2 decimals, removing trailing zeros
    return numRate.toFixed(2).replace(/\.?0+$/, '')
  }

  // Load taxes on component mount
  useEffect(() => {
    fetchTaxes()
  }, [])

  const fetchTaxes = async () => {
    try {
      setLoading(true)
      const response = await getTaxes()
      setTaxes(response)
    } catch (error) {
      console.error("Error fetching taxes:", error)
      toast.error("Error al cargar los impuestos")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTaxRate(0)
    setEditingTax(null)
  }

  const handleCreateTax = async () => {
    if (taxRate <= 0 || taxRate > 100) {
      toast.error("La tasa de impuesto debe estar entre 0.01% y 100%")
      return
    }

    try {
      setSubmitting(true)
      const newTax = { tax_rate: taxRate } as Tax
      await createTax(newTax)
      toast.success("Impuesto creado exitosamente")
      await fetchTaxes()
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (error: any) {
      console.error("Error creating tax:", error)
      toast.error(error?.response?.data?.message || "Error al crear el impuesto")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditTax = async (tax: Tax) => {
    try {
      const taxData = await getTaxById(tax.tax_id)
      setEditingTax(taxData)
      setTaxRate(taxData.tax_rate)
      setIsEditDialogOpen(true)
    } catch (error) {
      console.error("Error fetching tax for edit:", error)
      toast.error("Error al cargar los datos del impuesto")
    }
  }

  const handleUpdateTax = async () => {
    if (!editingTax) return

    if (taxRate <= 0 || taxRate > 100) {
      toast.error("La tasa de impuesto debe estar entre 0.01% y 100%")
      return
    }

    try {
      setSubmitting(true)
      const updatedTax = { ...editingTax, tax_rate: taxRate }
      await updateTax(editingTax.tax_id, updatedTax)
      toast.success("Impuesto actualizado exitosamente")
      await fetchTaxes()
      setIsEditDialogOpen(false)
      resetForm()
    } catch (error: any) {
      console.error("Error updating tax:", error)
      toast.error(error?.response?.data?.message || "Error al actualizar el impuesto")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (tax: Tax) => {
    setTaxToDelete(tax)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!taxToDelete) return

    try {
      await deleteTax(taxToDelete.tax_id.toString())
      toast.success("Impuesto eliminado exitosamente")
      await fetchTaxes()
      setIsDeleteDialogOpen(false)
      setTaxToDelete(null)
    } catch (error: any) {
      console.error("Error deleting tax:", error)
      toast.error(error?.response?.data?.message || "Error al eliminar el impuesto")
    }
  }

  const handleDialogClose = (isOpen: boolean, isEdit = false) => {
    if (!isOpen) {
      resetForm()
      if (isEdit) {
        setIsEditDialogOpen(false)
      } else {
        setIsCreateDialogOpen(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando impuestos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Percent className="w-8 h-8" />
            Gestión de Impuestos
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra las tasas de impuestos del sistema
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => handleDialogClose(open, false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Impuesto</DialogTitle>
              <DialogDescription>
                Ingresa la tasa de impuesto. Por ejemplo, para IVA 19%, ingresa 19.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tasa de Impuesto (%)</Label>
                <div className="relative">
                  <Input
                    id="taxRate"
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 19.00"
                    className="pr-8"
                  />
                  <Percent className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Valor actual: {formatTaxRate(taxRate)}%
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleDialogClose(false, false)}
                disabled={submitting}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleCreateTax} disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Crear Impuesto
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Taxes List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Impuestos</CardTitle>
          <CardDescription>
            {taxes.length === 0
              ? "No hay impuestos registrados"
              : `Se encontraron ${taxes.length} impuesto(s)`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {taxes.length === 0 ? (
            <div className="text-center py-12">
              <Percent className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                No hay impuestos registrados
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comienza creando un nuevo impuesto para el sistema
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Crear Primer Impuesto
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tasa de Impuesto</TableHead>
                  <TableHead>Porcentaje</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxes.map((tax) => (
                  <TableRow key={tax.tax_id}>
                    <TableCell className="font-medium">
                      #{tax.tax_id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-muted-foreground" />
                        {formatTaxRate(tax.tax_rate)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        Factor: {(tax.tax_rate / 100).toFixed(4)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTax(tax)}
                          className="gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(tax)}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => handleDialogClose(open, true)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Impuesto</DialogTitle>
            <DialogDescription>
              Modifica la tasa de impuesto. Valor actual: {editingTax ? formatTaxRate(editingTax.tax_rate) : 0}%
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTaxRate">Tasa de Impuesto (%)</Label>
              <div className="relative">
                <Input
                  id="editTaxRate"
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  placeholder="Ej: 19.00"
                  className="pr-8"
                />
                <Percent className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Nuevo valor: {formatTaxRate(taxRate)}%
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false, true)}
              disabled={submitting}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleUpdateTax} disabled={submitting}>
              {submitting ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2"></div>
                  Actualizando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Actualizar Impuesto
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente
              el impuesto con tasa del {taxToDelete ? formatTaxRate(taxToDelete.tax_rate) : 0}%.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
