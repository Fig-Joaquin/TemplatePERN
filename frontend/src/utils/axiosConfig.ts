import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("❌ VITE_API_URL no está definida en el archivo .env");
}

const api = axios.create({
  baseURL: API_URL, // ✅ Toma la URL desde `.env`
  withCredentials: true, // ✅ Necesario para que las cookies funcionen
});

export default api;
