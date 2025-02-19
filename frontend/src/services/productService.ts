import api from "../utils/axiosConfig"
import type { Product } from "../types/interfaces"

export const fetchProducts = async () => {
  const { data } = await api.get<Product[]>("/products")
  return data
}

export const fetchProductById = async (productId: number) => {
  const { data } = await api.get<Product>(`/products/${productId}`)
  return data
}

export const createProduct = async (productData: Partial<Product>) => {
  const { data } = await api.post<Product>("/products", productData)
  return data
}

export const updateProduct = async (productId: number, productData: Partial<Product>) => {
  const { data } = await api.put<Product>(`/products/${productId}`, productData)
  return data
}

export const deleteProduct = async (productId: number) => {
  const { data } = await api.delete(`/products/${productId}`)
  return data
}

