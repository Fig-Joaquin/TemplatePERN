import api from "../utils/axiosConfig"
import type { category } from "../types/interfaces"

// Fetch all product categories
export const fetchProductCategories = async (): Promise<category[]> => {
  const { data } = await api.get<category[]>("/productCategories")
  return data
}

// Fetch a product category by its ID
export const fetchProductCategoryById = async (categoryId: number): Promise<category> => {
  const { data } = await api.get<category>(`/productCategories/${categoryId}`)
  return data
}

// Create a new product category
export const createProductCategory = async (categoryData: Partial<category>): Promise<category> => {
  const { data } = await api.post<category>("/productCategories", categoryData)
  return data
}

// Update an existing product category
export const updateProductCategory = async (categoryId: number, categoryData: Partial<category>): Promise<category> => {
  const { data } = await api.put<category>(`/productCategories/${categoryId}`, categoryData)
  return data
}

// Delete a product category
export const deleteProductCategory = async (categoryId: number): Promise<void> => {
  await api.delete(`/productCategories/${categoryId}`)
}

