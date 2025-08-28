// src/components/userForm.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRut, cleanRut, validateRut, handleRutInput } from "../utils/rutUtils";
import type { User } from "../types/interfaces";

interface UserFormProps {
  user?: User;
  onSubmit: (userData: {
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
    // Para edición
    person_id?: number;
  }) => void;
  isSubmitting: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    // Datos de persona
    name: user?.person?.name || "",
    first_surname: user?.person?.first_surname || "",
    second_surname: user?.person?.second_surname || "",
    email: user?.person?.email || "",
    number_phone: user?.person?.number_phone || "",
    person_type: "proveedor", // Los administradores son tipo proveedor (personal interno)
    rut: user?.person?.rut || "",
    // Datos de usuario
    user_role: "administrador", // Siempre administrador
    username: user?.username || "",
    password: "",
    // Para edición
    person_id: user?.person?.person_id
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user) {
      setFormData({
        // Datos de persona
        name: user.person?.name || "",
        first_surname: user.person?.first_surname || "",
        second_surname: user.person?.second_surname || "",
        email: user.person?.email || "",
        number_phone: user.person?.number_phone || "",
        person_type: "proveedor", // Los administradores son tipo proveedor
        rut: user.person?.rut ? formatRut(user.person.rut) : "",
        // Datos de usuario
        user_role: "administrador", // Siempre administrador
        username: user.username || "",
        password: "",
        // Para edición
        person_id: user.person?.person_id
      });
    }
  }, [user]);

  const userRoles = [
    { value: "administrador", label: "Administrador" }
  ];

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Validación campos de persona
    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (!formData.first_surname.trim()) {
      newErrors.first_surname = "El apellido paterno es requerido";
    }

    // Email opcional - solo validar formato si se proporciona
    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El formato del email no es válido";
    }

    if (!formData.number_phone.trim()) {
      newErrors.number_phone = "El teléfono es requerido";
    }

    // RUT es opcional, pero si se proporciona debe ser válido
    if (formData.rut.trim()) {
      const rutValidation = validateRut(formData.rut);
      if (!rutValidation.isValid) {
        newErrors.rut = rutValidation.message || "RUT inválido";
      }
    }

    // Validación campos de usuario
    if (!formData.user_role) {
      newErrors.user_role = "Debe seleccionar un rol";
    }

    if (!formData.username || formData.username.length < 4) {
      newErrors.username = "El nombre de usuario debe tener al menos 4 caracteres";
    }

    if (!user && !formData.password) {
      newErrors.password = "La contraseña es obligatoria";
    }

    if (formData.password && formData.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Preparar datos para enviar al backend
      const dataToSubmit = {
        ...formData,
        // Campos opcionales: enviar undefined si están vacíos
        second_surname: formData.second_surname.trim() || undefined,
        email: formData.email.trim() || undefined,
        rut: formData.rut.trim() ? cleanRut(formData.rut) : undefined,
      };
      onSubmit(dataToSubmit);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Manejador especial para el RUT con formateo automático
  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedRut = handleRutInput(e.target.value);
    setFormData(prev => ({ ...prev, rut: formattedRut }));
    if (errors.rut) {
      setErrors(prev => ({ ...prev, rut: "" }));
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datos de Persona */}
      <div className="border-b pb-4">
        <h3 className="text-lg font-medium mb-4">Datos Personales</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ingrese el nombre"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="first_surname">Apellido Paterno *</Label>
            <Input
              id="first_surname"
              name="first_surname"
              type="text"
              value={formData.first_surname}
              onChange={handleInputChange}
              placeholder="Ingrese el apellido paterno"
            />
            {errors.first_surname && <p className="text-sm text-red-500">{errors.first_surname}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="second_surname">Apellido Materno</Label>
            <Input
              id="second_surname"
              name="second_surname"
              type="text"
              value={formData.second_surname}
              onChange={handleInputChange}
              placeholder="Ingrese el apellido materno (opcional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rut">RUT</Label>
            <Input
              id="rut"
              name="rut"
              type="text"
              value={formData.rut}
              onChange={handleRutChange}
              placeholder="12.345.678-9 (opcional)"
              maxLength={12}
            />
            {errors.rut && <p className="text-sm text-red-500">{errors.rut}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="correo@ejemplo.com (opcional)"
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="number_phone">Teléfono *</Label>
            <Input
              id="number_phone"
              name="number_phone"
              type="tel"
              value={formData.number_phone}
              onChange={handleInputChange}
              placeholder="+56 9 1234 5678"
            />
            {errors.number_phone && <p className="text-sm text-red-500">{errors.number_phone}</p>}
          </div>

          {/* Tipo de persona para administradores siempre es "proveedor" (personal interno) */}
        </div>
      </div>

      {/* Datos de Usuario */}
      <div>
        <h3 className="text-lg font-medium mb-4">Datos de Administrador</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="user_role">Rol de Usuario *</Label>
            <Select
              value={formData.user_role}
              onValueChange={(value) => handleSelectChange("user_role", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un rol" />
              </SelectTrigger>
              <SelectContent>
                {userRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.user_role && <p className="text-sm text-red-500">{errors.user_role}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Nombre de Usuario *</Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Ingrese el nombre de usuario"
            />
            {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="password">
              {user ? "Nueva Contraseña (dejar vacío para mantener actual)" : "Contraseña *"}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Ingrese la contraseña"
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            {!user && (
              <p className="text-xs text-gray-600">
                La contraseña debe tener al menos 8 caracteres
              </p>
            )}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Guardando..." : (user ? "Actualizar Administrador" : "Crear Administrador")}
      </Button>
    </form>
  );
};

export default UserForm;
