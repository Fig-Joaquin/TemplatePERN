import api from "../utils/axiosConfig"
import type { ProductCategory } from "../types/interfaces"

// Fetch all product categories
export const fetchProductCategories = async (): Promise<ProductCategory[]> => {
  const { data } = await api.get<ProductCategory[]>("/productCategories")
  return data
}

// Fetch a product category by its ID
export const fetchProductCategoryById = async (categoryId: number): Promise<ProductCategory> => {
  const { data } = await api.get<ProductCategory>(`/productCategories/${categoryId}`)
  return data
}

// Create a new product category
export const createProductCategory = async (categoryData: Partial<ProductCategory>): Promise<ProductCategory> => {
  const { data } = await api.post<ProductCategory>("/productCategories", categoryData)
  return data
}

// Update an existing product category
export const updateProductCategory = async (categoryId: number, categoryData: Partial<ProductCategory>): Promise<ProductCategory> => {
  const { data } = await api.put<ProductCategory>(`/productCategories/${categoryId}`, categoryData)
  return data
}

// Delete a product category
export const deleteProductCategory = async (categoryId: number): Promise<void> => {
  await api.delete(`/productCategories/${categoryId}`)
}

