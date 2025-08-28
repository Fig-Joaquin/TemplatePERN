import api from "../utils/axiosConfig"
import type { User } from "../types/interfaces"

// Funciones de autenticación existentes
export const checkUserSession = async () => {
  const response = await api.get<User>("/auth/check-session")
  console.log("Respuesta de checkUserSession:", response.data)
  return response.data
}

export const userLogout = async () => {
  const response = await api.post("/auth/logout")
  return response.data
}

// CRUD de usuarios
// Obtener todos los usuarios
export const fetchUsers = async (): Promise<User[]> => {
  const response = await api.get("/user");
  return response.data;
};

// Obtener un usuario por ID
export const fetchUserById = async (id: number): Promise<User> => {
  const response = await api.get(`/user/${id}`);
  return response.data;
};

// Crear un nuevo usuario con persona
export const createUser = async (userData: {
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
}): Promise<User> => {
  const response = await api.post("/user/create-with-person", userData);
  return response.data;
};

// Actualizar un usuario
export const updateUser = async (id: number, userData: {
  user_role?: string;
  username?: string;
  password?: string;
}): Promise<User> => {
  const response = await api.put(`/user/${id}`, userData);
  return response.data;
};

// Eliminar un usuario
export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/user/${id}`);
};

