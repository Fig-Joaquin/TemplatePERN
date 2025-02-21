import { z } from "zod";
import { WorkOrderSchema } from "./workOrderValidator";
import { ProductSchema } from "../../schema/products/productValidator";
import { QuotationSchema } from "./quotationValidator";
import { TaxSchema } from "./taxValidator";


export const workProductDetailSchema = z.object({
    work_order_id: z.number().int().positive().optional(),
    product_id: z.number().int().positive().optional(),
    quotation_id: z.number().int().positive().optional(),
    work_order: WorkOrderSchema.optional(),
    product: ProductSchema.optional(),
    quotation: QuotationSchema.optional(),
    tax_id: z.number().int().positive(),
    tax: TaxSchema.optional(),
    quantity: z.number().int().min(1, { message: "La cantidad debe ser al menos 1" }),
    sale_price: z.number().nonnegative({ message: "El precio de venta no puede ser negativo" }).multipleOf(0.01),
    discount: z.number().nonnegative({ message: "El descuento no puede ser negativo" }).max(100).multipleOf(0.01),
    labor_price: z.number().nonnegative({ message: "El precio de mano de obra no puede ser negativo" }).multipleOf(0.01)
});

export type WorkProductDetailInput = z.infer<typeof workProductDetailSchema>;