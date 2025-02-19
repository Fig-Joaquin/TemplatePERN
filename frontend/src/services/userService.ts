import api from "../utils/axiosConfig"
import type { User } from "../types/interfaces"

export const checkUserSession = async () => {
  const response = await api.get<User>("/auth/check-session")
  console.log("Respuesta de checkUserSession:", response.data)
  return response.data
}

export const userLogout = async () => {
  const response = await api.post("/auth/logout")
  return response.data
}

