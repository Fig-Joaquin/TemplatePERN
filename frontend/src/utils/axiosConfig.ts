import axios from "axios"
import { toast } from "react-toastify"

const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error("❌ VITE_API_URL no está definida en el archivo .env")
}

const api = axios.create({
  baseURL: API_URL, // ✅ Toma la URL desde `.env`
  withCredentials: true, // ✅ Necesario para que las cookies funcionen
})

// Interceptor para respuestas de error  
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message

    if (status === 403 && typeof message === "string" && message.toLowerCase().includes("acceso denegado")) {
      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
        toastId: "access-denied-403",
      })
    }

    // Log para debugging en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error("API Error:", error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

export default api

