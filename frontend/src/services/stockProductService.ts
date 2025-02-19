import api from "../utils/axiosConfig"
import type { StockProduct } from "../types/interfaces"

const API_URL = "/stockProducts"

export const getStockProducts = async () => {
  try {
    const response = await api.get(API_URL)
    return response.data
  } catch (error) {
    console.error("Error fetching stock products", error)
    throw error
  }
}

export const getStockProductById = async (id: string) => {
  try {
    const response = await api.get(`${API_URL}/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching stock product with id ${id}`, error)
    throw error
  }
}

export const createStockProduct = async (stockProduct: StockProduct) => {
  try {
    const response = await api.post(API_URL, stockProduct)
    return response.data
  } catch (error) {
    console.error("Error creating stock product", error)
    throw error
  }
}

export const updateStockProduct = async (id: string, stockProduct: StockProduct) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, stockProduct)
    return response.data
  } catch (error) {
    console.error(`Error updating stock product with id ${id}`, error)
    throw error
  }
}

export const deleteStockProduct = async (id: string) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error deleting stock product with id ${id}`, error)
    throw error
  }
}

