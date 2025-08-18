"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Banknote, Edit, Trash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatPriceCLP } from "@/utils/formatPriceCLP";
import { fetchGastos, deleteGasto } from "@/services/gastoServiceAdapter";
import type { Gasto } from "@/types/interfaces";
import { formatDate } from "@/utils/formDate";

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gastoToDelete, setGastoToDelete] = useState<number | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchGastos();
        setGastos(data);
      } catch (error) {
        console.error("Error al cargar los gastos:", error);
        toast.error("Error al cargar los gastos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteClick = (id: number) => {
    setGastoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (gastoToDelete) {
      try {
        await deleteGasto(gastoToDelete);
        setGastos(gastos.filter(gasto => gasto.id_gasto_empresa !== gastoToDelete));
        toast.success("Gasto eliminado correctamente");
      } catch (error) {
        console.error("Error al eliminar el gasto:", error);
        toast.error("Error al eliminar el gasto");
      } finally {
        setDeleteDialogOpen(false);
        setGastoToDelete(null);
      }
    }
  };

  const filteredGastos = gastos.filter(gasto => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      gasto.descripcion.toLowerCase().includes(searchTermLower) ||
      gasto.tipo_gasto.nombre_tipo_gasto.toLowerCase().includes(searchTermLower) ||
      (gasto.numero_boleta && gasto.numero_boleta.toLowerCase().includes(searchTermLower))
    );
  });


  return (
    <motion.div
      className="container mx-auto p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Banknote className="h-8 w-8" />
          Registro de Gastos
        </h1>
        <Button onClick={() => navigate("/admin/finanzas/gastos/nuevo")} className="bg-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Gasto
        </Button>
      </div>

      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar gastos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Cargando gastos...</p>
        </div>
      ) : (
        <>
          {filteredGastos.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-lg text-muted-foreground">No se encontraron gastos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredGastos.map((gasto) => (
                  <motion.div
                    key={gasto.id_gasto_empresa}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg line-clamp-1">{gasto.descripcion}</h3>
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Fecha:</span> {formatDate(gasto.fecha_gasto)}
                            </p>
                          </div>
                          <Badge variant="outline">{gasto.tipo_gasto.nombre_tipo_gasto}</Badge>
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Monto:</span>
                            <span className="text-lg font-bold text-primary">{formatPriceCLP(gasto.monto)}</span>
                          </div>

                          {gasto.numero_boleta && (
                            <div className="flex justify-between items-center mt-1">
                              <span className="font-medium">Boleta:</span>
                              <span>{gasto.numero_boleta}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/finanzas/gastos/editar/${gasto.id_gasto_empresa}`)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(gasto.id_gasto_empresa!)}
                          >
                            <Trash className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Confirmar eliminación?</DialogTitle>
          </DialogHeader>
          <p>¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer.</p>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}