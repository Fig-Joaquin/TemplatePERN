import { z } from "zod";

export const ProductSchema = z.object({
    product_name: z.string()
        .min(2, "El nombre del producto debe tener entre 2 y 100 caracteres")
        .max(100, "El nombre del producto debe tener entre 2 y 100 caracteres"),
    
    product_type_id: z.number()
        .int()
        .positive("El tipo de producto es requerido"),
    
    profit_margin: z.number()
        .min(0, "El margen de ganancia no puede ser negativo")
        .max(999.99, "El margen de ganancia no puede ser mayor a 999.99"),
    
    last_purchase_price: z.number()
        .min(0, "El precio de última compra no puede ser negativo"),
    
    sale_price: z.number()
        .min(0, "El precio de venta no puede ser negativo"),
    
    description: z.string(),
    
    product_quantity: z.number()
        .int()
        .min(0, "La cantidad de productos no puede ser negativa")
});

export type ProductInput = z.infer<typeof ProductSchema>;