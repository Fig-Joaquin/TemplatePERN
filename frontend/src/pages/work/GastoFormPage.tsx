"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Banknote, Save, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { NumberInput } from "@/components/numberInput";
import {
  fetchGastoById,
  createGasto,
  updateGasto
} from "@/services/gastoServiceAdapter";
import { fetchTiposGasto } from "@/services/tipoGastoServiceAdapter";
import type { Gasto, TipoGasto } from "@/types/interfaces";
import { formatDateForInput } from "@/utils/formatDateForInput";

export default function GastoFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [tiposGasto, setTiposGasto] = useState<TipoGasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<{
    expense_type_id: string;
    description: string;
    amount: number;
    expense_date: string;
    receipt_number: string;
  }>({
    expense_type_id: "",
    description: "",
    amount: 0,
    expense_date: formatDateForInput(new Date()), // Corregido para usar formatDateForInput
    receipt_number: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const tiposData = await fetchTiposGasto();
        setTiposGasto(tiposData);

        if (isEditMode) {
          const gastoData = await fetchGastoById(parseInt(id));
          setFormData({
            expense_type_id: (gastoData.expense_type?.expense_type_id ?? "").toString(),
            description: gastoData.description,
            amount: Number(gastoData.amount),
            expense_date: formatDateForInput(
              gastoData.expense_date ? new Date(gastoData.expense_date) : new Date()
            ),
            receipt_number: gastoData.receipt_number || ""
          });
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast.error("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMontoChange = (value: number) => {
    setFormData(prev => ({ ...prev, amount: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.expense_type_id || !formData.description || formData.amount <= 0) {
      toast.error("Por favor complete todos los campos obligatorios");
      return;
    }

      try {
        setSubmitting(true);

        // No necesitamos manipular la fecha de nuevo, ya está en formato correcto
        // Simplemente usar el valor del input directamente
        const fechaISOString = formData.expense_date;      // Encontrar el tipo de gasto seleccionado para obtener su nombre
      const selectedTipoGasto = tiposGasto.find(
        tipo => tipo.expense_type_id === parseInt(formData.expense_type_id)
      );
      
      const gastoData: Partial<Gasto> = {
        description: formData.description,
        amount: formData.amount,
        expense_date: fechaISOString,
        receipt_number: formData.receipt_number || undefined,
        expense_type: {
          expense_type_id: parseInt(formData.expense_type_id),
          expense_type_name: selectedTipoGasto?.expense_type_name || ""
        }
      };

      // Enviamos directamente el gastoData sin modificaciones
      const dataToSend = gastoData;
      
      console.log('Datos a enviar:', dataToSend);

      if (isEditMode) {
        await updateGasto(parseInt(id), dataToSend);
        toast.success("Gasto actualizado correctamente");
      } else {
        await createGasto(dataToSend);
        toast.success("Gasto creado correctamente");
      }

      navigate("/admin/finanzas/gastos");
    } catch (error: any) {
      console.error("Error al guardar gasto:", error);
      toast.error(
        error.response?.data?.message ||
        "Error al guardar el gasto"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-lg text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="container mx-auto p-6 max-w-3xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/finanzas/gastos")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Banknote className="h-8 w-8" />
          {isEditMode ? "Editar Gasto" : "Nuevo Gasto"}
        </h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="expense_type_id">Tipo de Gasto*</Label>
                <Select
                  value={formData.expense_type_id}
                  onValueChange={(value) => handleSelectChange("expense_type_id", value)}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar tipo de gasto" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposGasto.map((tipo) => (
                      <SelectItem
                        key={tipo.expense_type_id}
                        value={tipo.expense_type_id!.toString()}
                      >
                        {tipo.expense_type_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                <div>
                <Label htmlFor="description">Descripción*</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Descripción del gasto"
                  rows={3}
                  required
                />
                </div>

              <div>
                <Label htmlFor="monto">Monto*</Label>
                <NumberInput
                  id="monto"
                  value={formData.amount}
                  onChange={handleMontoChange}
                  min={1}
                  isPrice
                  required
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="fecha_gasto">Fecha*</Label>
                <Input
                  id="fecha_gasto"
                  name="expense_date"
                  type="date"
                  value={formData.expense_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="numero_boleta">Número de Boleta/Factura</Label>
                <Input
                  id="numero_boleta"
                  name="receipt_number"
                  value={formData.receipt_number}
                  onChange={handleChange}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/finanzas/gastos")}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="gap-2"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></span>
                    {isEditMode ? "Actualizando..." : "Guardando..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditMode ? "Actualizar" : "Guardar"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}