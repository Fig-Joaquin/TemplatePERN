import api from "@/utils/axiosConfig"
import { Tax } from "@/types/interfaces";
const API_URL = "/taxes";

export const getTaxes = async () => {
    try {
        const response = await api.get(API_URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching taxes:', error);
        throw error;
    }
};

export const getTaxById = async (id: number) => {
    try {
        const response = await api.get(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching tax with id ${id}:`, error);
        throw error;
    }
};

export const createTax = async (taxData: Tax) => {
    try {
        const response = await api.post(API_URL, taxData);
        return response.data;
    } catch (error) {
        console.error('Error creating tax:', error);
        throw error;
    }
};

export const updateTax = async (id: number, taxData: Tax) => {
    try {
        const response = await api.put(`${API_URL}/${id}`, taxData);
        return response.data;
    } catch (error) {
        console.error(`Error updating tax with id ${id}:`, error);
        throw error;
    }
};

export const deleteTax = async (id: string) => {
    try {
        const response = await api.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting tax with id ${id}:`, error);
        throw error;
    }
};