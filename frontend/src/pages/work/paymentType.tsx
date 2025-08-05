"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit, Trash, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { fetchPaymentTypes, createPaymentType, updatePaymentType, deletePaymentType } from "@/services/work/paymentType";
import type { PaymentType } from "@/types/interfaces";

export default function PaymentTypePage() {
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [typeName, setTypeName] = useState("");
  const [editingPaymentType, setEditingPaymentType] = useState<PaymentType | null>(null);
  const [deletingPaymentType, setDeletingPaymentType] = useState<PaymentType | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await fetchPaymentTypes();
      setPaymentTypes(data);
    } catch (error) {
      console.error("Error al cargar los tipos de pago:", error);
      toast.error("Error al cargar los tipos de pago");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTypeName("");
    setEditingPaymentType(null);
    setDeletingPaymentType(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName.trim()) {
      toast.error("El nombre del tipo de pago es obligatorio");
      return;
    }
    
    try {
      await createPaymentType({ 
        type_name: typeName
      });
      toast.success("Tipo de pago creado exitosamente");
      setIsCreateModalOpen(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 
        "Error al crear el tipo de pago"
      );
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName.trim() || !editingPaymentType) {
      return;
    }
    
    try {
      await updatePaymentType(editingPaymentType.payment_type_id!, {
        type_name: typeName
      });
      toast.success("Tipo de pago actualizado correctamente");
      setIsEditModalOpen(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 
        "Error al actualizar el tipo de pago"
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPaymentType) return;
    
    try {
      await deletePaymentType(deletingPaymentType.payment_type_id!);
      toast.success("Tipo de pago eliminado correctamente");
      setIsDeleteModalOpen(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 
        "Error al eliminar el tipo de pago. Podría estar en uso por algún pago"
      );
    }
  };

  const handleEdit = (paymentType: PaymentType) => {
    setEditingPaymentType(paymentType);
    setTypeName(paymentType.type_name);
    setIsEditModalOpen(true);
  };

  const handleDelete = (paymentType: PaymentType) => {
    setDeletingPaymentType(paymentType);
    setIsDeleteModalOpen(true);
  };

  // Filtrado por búsqueda
  const filteredPaymentTypes = paymentTypes.filter(type => 
    type.type_name.toLowerCase().includes(searchTerm.toLowerCase())
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
          Tipos de Pago
        </h1>
        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Tipo de Pago
        </Button>
      </div>

      <div className="relative max-w-md">
        <Input
          type="text"
          placeholder="Buscar tipos de pago..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Cargando tipos de pago...</p>
        </div>
      ) : filteredPaymentTypes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No se encontraron tipos de pago</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredPaymentTypes.map((tipo) => (
              <motion.div
                key={tipo.payment_type_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-lg">{tipo.type_name}</h3>
                    </div>
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
      )}

      {/* Modal de Creación */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Tipo de Pago</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombreTipoPago">Nombre del Tipo de Pago*</Label>
                <Input
                  id="nombreTipoPago"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  placeholder="Ingrese el nombre del tipo de pago"
                  required
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
            <DialogTitle>Editar Tipo de Pago</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editNombreTipoPago">Nombre del Tipo de Pago*</Label>
                <Input
                  id="editNombreTipoPago"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  placeholder="Ingrese el nombre del tipo de pago"
                  required
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
            ¿Estás seguro de que deseas eliminar el tipo de pago 
            <span className="font-semibold"> "{deletingPaymentType?.type_name}"</span>? 
            Esta acción no se puede deshacer.
          </p>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => {
              setIsDeleteModalOpen(false);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}