import api from "../utils/axiosConfig";
import { type } from "../types/interfaces";

// Obtener todos los tipos de producto
export const fetchProductTypes = async (): Promise<type[]> => {
	const { data } = await api.get<type[]>("/productTypes");
	return data;
};

// Obtener un tipo de producto por su ID
export const fetchProductTypeById = async (id: number): Promise<type> => {
	const { data } = await api.get<type>(`/productTypes/${id}`);
	return data;
};

// Crear un nuevo tipo de producto
export const createProductType = async (productTypeData: Partial<type>): Promise<type> => {
	const { data } = await api.post<type>("/productTypes", productTypeData);
	return data;
};

// Actualizar un tipo de producto existente
export const updateProductType = async (id: number, productTypeData: Partial<type>): Promise<type> => {
	const { data } = await api.put<type>(`/productTypes/${id}`, productTypeData);
	return data;
};

// Eliminar un tipo de producto
export const deleteProductType = async (id: number): Promise<void> => {
	await api.delete(`/productTypes/${id}`);
};
