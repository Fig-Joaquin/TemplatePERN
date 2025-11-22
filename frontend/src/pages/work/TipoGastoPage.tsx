"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit, Trash, CreditCard, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  fetchTiposGasto, 
  createTipoGasto, 
  updateTipoGasto, 
  deleteTipoGasto 
} from "@/services/tipoGastoService";
import type { TipoGasto } from "@/types/interfaces";

export default function TipoGastoPage() {
  const [tiposGasto, setTiposGasto] = useState<TipoGasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [nombreTipoGasto, setNombreTipoGasto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [editingTipoGasto, setEditingTipoGasto] = useState<TipoGasto | null>(null);
  const [deletingTipoGasto, setDeletingTipoGasto] = useState<TipoGasto | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await fetchTiposGasto();
      setTiposGasto(data);
    } catch (error: any) {
      console.error("Error al cargar los tipos de gasto:", error);
      toast.error(error.response?.data?.message || error.message || "Error al cargar los tipos de gasto");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNombreTipoGasto("");
    setDescripcion("");
    setEditingTipoGasto(null);
    setDeletingTipoGasto(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreTipoGasto.trim()) {
      toast.error("El nombre del tipo de gasto es obligatorio");
      return;
    }
    
    try {
      await createTipoGasto({ 
        expense_type_name: nombreTipoGasto, 
        description: descripcion || undefined 
      });
      toast.success("Tipo de gasto creado exitosamente");
      setIsCreateModalOpen(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 
        "Error al crear el tipo de gasto"
      );
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreTipoGasto.trim() || !editingTipoGasto) {
      return;
    }
    
    try {
      await updateTipoGasto(editingTipoGasto.expense_type_id!, {
        expense_type_name: nombreTipoGasto,
        description: descripcion || undefined
      });
      toast.success("Tipo de gasto actualizado correctamente");
      setIsEditModalOpen(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 
        "Error al actualizar el tipo de gasto"
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTipoGasto) return;
    
    try {
      await deleteTipoGasto(deletingTipoGasto.expense_type_id!);
      toast.success("Tipo de gasto eliminado correctamente");
      setIsDeleteModalOpen(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 
        "Error al eliminar el tipo de gasto"
      );
    }
  };

  const handleEdit = (tipoGasto: TipoGasto) => {
    setEditingTipoGasto(tipoGasto);
    setNombreTipoGasto(tipoGasto.expense_type_name || "");
    setDescripcion(tipoGasto.description || "");
    setIsEditModalOpen(true);
  };

  const handleDelete = (tipoGasto: TipoGasto) => {
    setDeletingTipoGasto(tipoGasto);
    setIsDeleteModalOpen(true);
  };

  const filteredTiposGasto = tiposGasto.filter(tipo =>
    tipo.expense_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tipo.description && tipo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <motion.div
      className="container mx-auto p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          Tipos de Gasto
        </h1>
        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Tipo de Gasto
        </Button>
      </div>

      <div className="relative max-w-md">
        <Input
          type="text"
          placeholder="Buscar tipos de gasto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Cargando tipos de gasto...</p>
        </div>
      ) : filteredTiposGasto.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredTiposGasto.map((tipo) => (
              <motion.div
                key={tipo.expense_type_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold text-lg">{tipo.expense_type_name}</h3>
                      <Badge variant="outline" className="ml-2">
                        {tipo.expense_type_id}
                      </Badge>
                    </div>

                    {tipo.description && (
                      <div className="mb-4 flex gap-2 items-start">
                        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-muted-foreground text-sm">{tipo.description}</p>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tipo)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(tipo)}
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
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center py-16 px-4"
        >
          <div className="bg-muted/50 rounded-full p-8 mb-6">
            <CreditCard className="w-24 h-24 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            No se encontraron tipos de gasto
          </h2>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            {searchTerm
              ? "No hay tipos de gasto que coincidan con tu búsqueda. Intenta con otros términos."
              : "Aún no hay tipos de gasto registrados. Crea el primer tipo para comenzar."}
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear Primer Tipo de Gasto
          </Button>
        </motion.div>
      )}

      {/* Modal de Creación */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Tipo de Gasto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombreTipoGasto">Nombre del Tipo de Gasto*</Label>
                <Input
                  id="nombreTipoGasto"
                  value={nombreTipoGasto}
                  onChange={(e) => setNombreTipoGasto(e.target.value)}
                  placeholder="Ingrese el nombre del tipo de gasto"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ingrese una descripción (opcional)"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button type="submit">Crear</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tipo de Gasto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editNombreTipoGasto">Nombre del Tipo de Gasto*</Label>
                <Input
                  id="editNombreTipoGasto"
                  value={nombreTipoGasto}
                  onChange={(e) => setNombreTipoGasto(e.target.value)}
                  placeholder="Ingrese el nombre del tipo de gasto"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDescripcion">Descripción</Label>
                <Textarea
                  id="editDescripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ingrese una descripción (opcional)"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => {
                setIsEditModalOpen(false);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button type="submit">Actualizar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Eliminación */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <p>
            ¿Estás seguro de que deseas eliminar el tipo de gasto
            <span className="font-semibold"> "{deletingTipoGasto?.expense_type_name}"</span>?
            Esta acción no se puede deshacer.
          </p>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => {
              setIsDeleteModalOpen(false);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}