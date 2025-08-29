import api from "../utils/axiosConfig";

export interface ProductPurchase {
  product_purchase_id: number;
  product: {
    product_id: number;
    product_name: string;
    type: {
      type_name: string;
    };
    supplier?: {
      supplier_name: string;
    };
  };
  purchase_history: {
    purchase_history_id: number;
    purchase_date: string;
    arrival_date: string;
    description: string;
  };
  purchase_status: "processed" | "returned";
  purchase_price: number;
  quantity: number;
  total_price: number;
}

export interface PurchaseHistory {
  purchase_history_id: number;
  purchase_date: string;
  arrival_date: string;
  description: string;
  purchases: ProductPurchase[];
}

export interface CreatePurchaseData {
  purchase_date: string;
  arrival_date: string;
  description: string;
  products: {
    product_id: number;
    purchase_status: "processed" | "returned";
    purchase_price: number;
    quantity: number;
    total_price: number;
  }[];
}

// Obtener todas las compras de productos
export const getAllProductPurchases = async (): Promise<ProductPurchase[]> => {
  const { data } = await api.get<ProductPurchase[]>("/productPurchases");
  return data;
};

// Obtener compras por ID del historial
export const getPurchasesByHistoryId = async (historyId: number): Promise<ProductPurchase[]> => {
  const { data } = await api.get<ProductPurchase[]>(`/productPurchases/history/${historyId}`);
  return data;
};

// Crear una nueva compra de productos
export const createProductPurchase = async (purchaseData: CreatePurchaseData): Promise<{ message: string }> => {
  const { data } = await api.post<{ message: string }>("/productPurchases", purchaseData);
  return data;
};

// Actualizar estado de una compra
export const updatePurchaseStatus = async (
  purchaseId: number, 
  status: "processed" | "returned"
): Promise<{ message: string }> => {
  const { data } = await api.patch<{ message: string }>(`/productPurchases/${purchaseId}/status`, {
    purchase_status: status
  });
  return data;
};

// Eliminar una compra
export const deleteProductPurchase = async (purchaseId: number): Promise<{ message: string }> => {
  const { data } = await api.delete<{ message: string }>(`/productPurchases/${purchaseId}`);
  return data;
};

// Obtener historial de compras completo
export const getPurchaseHistory = async (): Promise<PurchaseHistory[]> => {
  const { data } = await api.get<PurchaseHistory[]>("/productPurchases/history");
  return data;
};

// Obtener productos disponibles para compra
export const getProductsForPurchase = async () => {
  const { data } = await api.get("/products");
  return data;
};
