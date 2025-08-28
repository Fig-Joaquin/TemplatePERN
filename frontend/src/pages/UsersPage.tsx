// src/pages/UsersPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { Plus, Users, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserList from "../components/userList";
import UserForm from "../components/userForm";
import { fetchUsers, createUser, updateUser, deleteUser } from "../services/userService";
import type { User } from "../types/interfaces";

// Componente de confirmación de eliminación
const DeleteConfirmation: React.FC<{
  user: User | null;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ user, onConfirm, onCancel }) => {
  if (!user) return null;

  return (
    <div className="space-y-4">
      <p>¿Estás seguro de que deseas eliminar al usuario <strong>{user.username}</strong>?</p>
      <p className="text-sm text-gray-600">
        Usuario: {user.person ? `${user.person.name} ${user.person.first_surname}` : "Sin información"}
      </p>
      <p className="text-sm text-red-600">Esta acción no se puede deshacer.</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          Eliminar
        </Button>
      </div>
    </div>
  );
};

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Función utilitaria para manejar errores
  const getErrorMessage = (error: any, defaultMessage: string): string => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    } else if (error.response?.data?.error) {
      return error.response.data.error;
    } else if (error.response?.data?.errors) {
      // Si hay errores de validación múltiples (array de objetos con message)
      const errors = error.response.data.errors;
      if (Array.isArray(errors)) {
        // Si son objetos con mensaje, extraer solo los mensajes
        const messages = errors.map((err: any) =>
          typeof err === 'object' && err.message ? err.message : err
        );
        return messages.join(". ");
      } else if (typeof errors === 'object') {
        return Object.values(errors).join(". ");
      }
    } else if (error.message) {
      return error.message;
    }

    // Manejo por código de estado HTTP
    switch (error.response?.status) {
      case 400:
        return "Datos inválidos. Por favor revise la información ingresada.";
      case 401:
        return "No autorizado. Por favor inicie sesión nuevamente.";
      case 404:
        return "Recurso no encontrado.";
      case 409:
        return "Conflicto con los datos existentes.";
      case 500:
        return "Error interno del servidor. Intente nuevamente.";
      default:
        return defaultMessage;
    }
  };

  // Cargar datos iniciales
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const usersData = await fetchUsers();
      setUsers(usersData);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast.error(getErrorMessage(error, "Error al cargar los usuarios"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrar usuarios según el término de búsqueda
  const filteredUsers = users.filter((user) => {
    const searchValue = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchValue) ||
      user.user_role.toLowerCase().includes(searchValue) ||
      (user.person?.name?.toLowerCase().includes(searchValue)) ||
      (user.person?.first_surname?.toLowerCase().includes(searchValue)) ||
      (user.person?.rut?.toLowerCase().includes(searchValue))
    );
  });

  // Manejar creación de usuario
  const handleCreate = async (userData: {
    // Datos de persona
    name: string;
    first_surname: string;
    second_surname?: string;
    email?: string;
    number_phone: string;
    person_type: string;
    rut?: string;
    // Datos de usuario
    user_role: string;
    username: string;
    password: string;
  }) => {
    try {
      setIsSubmitting(true);
      await createUser(userData);
      toast.success("Usuario creado exitosamente");
      setAddModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Error al crear usuario:", error);
      toast.error(getErrorMessage(error, "Error al crear usuario"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar edición de usuario
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleUpdate = async (userData: {
    // Datos de persona
    name: string;
    first_surname: string;
    second_surname?: string;
    email: string;
    number_phone: string;
    person_type: string;
    rut: string;
    // Datos de usuario
    user_role: string;
    username: string;
    password: string;
    person_id?: number;
  }) => {
    if (!selectedUser) return;

    try {
      setIsSubmitting(true);
      const updateData: any = {
        user_role: userData.user_role,
        username: userData.username
      };

      // Solo incluir password si se proporcionó
      if (userData.password) {
        updateData.password = userData.password;
      }

      await updateUser(selectedUser.user_id, updateData);
      toast.success("Usuario actualizado exitosamente");
      setEditModalOpen(false);
      setSelectedUser(null);
      loadData();
    } catch (error: any) {
      console.error("Error al actualizar usuario:", error);
      toast.error(getErrorMessage(error, "Error al actualizar usuario"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar eliminación de usuario
  const handleDelete = (userId: number) => {
    const user = users.find(u => u.user_id === userId);
    setSelectedUser(user || null);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser(selectedUser.user_id);
      toast.success("Usuario eliminado exitosamente");
      setDeleteModalOpen(false);
      setSelectedUser(null);
      loadData();
    } catch (error: any) {
      console.error("Error al eliminar usuario:", error);
      toast.error(getErrorMessage(error, "Error al eliminar usuario"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <motion.h1
          className="text-3xl font-bold text-primary flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Users className="w-8 h-8" />
          Gestión de Usuarios
        </motion.h1>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="bg-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Barra de búsqueda */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, usuario, rol o RUT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </motion.div>

      {/* Lista de usuarios */}
      <motion.div
        className="bg-card shadow-lg rounded-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground">Cargando usuarios...</p>
          </div>
        ) : (
          <AnimatePresence>
            <UserList
              users={filteredUsers}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </AnimatePresence>
        )}
      </motion.div>

      {/* Modal para crear usuario */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <UserForm
            onSubmit={handleCreate}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Modal para editar usuario */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <UserForm
            user={selectedUser || undefined}
            onSubmit={handleUpdate}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Modal para confirmar eliminación */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <DeleteConfirmation
            user={selectedUser}
            onConfirm={confirmDelete}
            onCancel={() => {
              setDeleteModalOpen(false);
              setSelectedUser(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
