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
    id_tipo_gasto: string;
    descripcion: string;
    monto: number;
    fecha_gasto: string;
    numero_boleta: string;
  }>({
    id_tipo_gasto: "",
    descripcion: "",
    monto: 0,
    fecha_gasto: formatDateForInput(new Date()), // Corregido para usar formatDateForInput
    numero_boleta: ""
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
            id_tipo_gasto: gastoData.tipo_gasto.id_tipo_gasto!.toString(),
            descripcion: gastoData.descripcion,
            monto: Number(gastoData.monto),
            fecha_gasto: formatDateForInput(new Date(gastoData.fecha_gasto)),
            numero_boleta: gastoData.numero_boleta || ""
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
    setFormData(prev => ({ ...prev, monto: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.id_tipo_gasto || !formData.descripcion || formData.monto <= 0) {
      toast.error("Por favor complete todos los campos obligatorios");
      return;
    }

    try {
      setSubmitting(true);

      // No necesitamos manipular la fecha de nuevo, ya está en formato correcto
      // Simplemente usar el valor del input directamente
      const fechaISOString = formData.fecha_gasto;

      const gastoData: Partial<Gasto> = {
        descripcion: formData.descripcion,
        monto: formData.monto,
        fecha_gasto: fechaISOString,
        numero_boleta: formData.numero_boleta || undefined
      };

      // Agregar id_tipo_gasto como propiedad separada para la API
      const dataToSend = {
        ...gastoData,
        id_tipo_gasto: parseInt(formData.id_tipo_gasto)
      };

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
                <Label htmlFor="id_tipo_gasto">Tipo de Gasto*</Label>
                <Select
                  value={formData.id_tipo_gasto}
                  onValueChange={(value) => handleSelectChange("id_tipo_gasto", value)}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar tipo de gasto" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposGasto.map((tipo) => (
                      <SelectItem
                        key={tipo.id_tipo_gasto}
                        value={tipo.id_tipo_gasto!.toString()}
                      >
                        {tipo.nombre_tipo_gasto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción*</Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
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
                  value={formData.monto}
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
                  name="fecha_gasto"
                  type="date"
                  value={formData.fecha_gasto}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="numero_boleta">Número de Boleta/Factura</Label>
                <Input
                  id="numero_boleta"
                  name="numero_boleta"
                  value={formData.numero_boleta}
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