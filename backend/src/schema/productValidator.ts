import { z } from "zod";
import { ProductTypeSchema } from "./productTypeValidator";
import { SupplierSchema } from "./suppliersValidator";


export const ProductSchema = z.object({
    product_id: z.number().optional(),
    product_type_id: z.number(),
    supplier_id: z.number(),
    type: ProductTypeSchema.optional(),
    supplier: SupplierSchema.optional(),
    product_name: z.string()
        .min(2, "El nombre del producto debe tener entre 2 y 100 caracteres")
        .max(100, "El nombre del producto debe tener entre 2 y 100 caracteres"),
    
    
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
        .nonnegative("La cantidad no puede ser negativa")
        .default(0),  
});

export type ProductInput = z.infer<typeof ProductSchema>;