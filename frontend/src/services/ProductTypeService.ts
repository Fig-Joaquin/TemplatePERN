import api from "../utils/axiosConfig"
import type { ProductType } from "../types/interfaces"

// Obtener todos los tipos de producto
export const fetchProductTypes = async (): Promise<ProductType[]> => {
  const { data } = await api.get<ProductType[]>("/productTypes")
  return data
}

// Obtener un tipo de producto por su ID
export const fetchProductTypeById = async (id: number): Promise<ProductType> => {
  const { data } = await api.get<ProductType>(`/productTypes/${id}`)
  return data
}

// Crear un nuevo tipo de producto
export const createProductType = async (productTypeData: Partial<ProductType>): Promise<ProductType> => {
  const { data } = await api.post<ProductType>("/productTypes", productTypeData)
  return data
}

// Actualizar un tipo de producto existente
export const updateProductType = async (id: number, productTypeData: Partial<ProductType>): Promise<ProductType> => {
  const { data } = await api.put<ProductType>(`/productTypes/${id}`, productTypeData)
  return data
}

// Eliminar un tipo de producto
export const deleteProductType = async (id: number): Promise<void> => {
  await api.delete(`/productTypes/${id}`)
}

