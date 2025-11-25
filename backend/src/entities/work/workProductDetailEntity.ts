import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, RelationId } from "typeorm";
import { IsNumber, Min, IsOptional, Max } from "class-validator";
import { 
    WorkOrder, 
    Product, 
    Tax, 
    Quotation
} 
from "..";

@Entity("work_product_details")
export class WorkProductDetail {
    @PrimaryGeneratedColumn()
    work_product_detail_id!: number;

    @ManyToOne(() => WorkOrder, { nullable: true })
    @JoinColumn({ name: "work_order_id" })
    work_order!: WorkOrder | null;
    

    @RelationId((detail: WorkProductDetail) => detail.work_order)
    work_order_id!: number;

    @ManyToOne(() => Product, { nullable: false, onDelete: "RESTRICT" })
    @JoinColumn({ name: "product_id" })
    product!: Product;
    
    @RelationId((detail: WorkProductDetail) => detail.product)
    product_id!: number;

    @ManyToOne(() => Quotation, { nullable: true , cascade: true })
    @JoinColumn({ name: "quotation_id" })
    quotation!: Quotation;

    @RelationId((detail: WorkProductDetail) => detail.quotation)
    quotation_id!: number;

    @ManyToOne(() => Tax, { nullable: false })
    @JoinColumn({ name: "tax_id" })
    tax!: Tax;

    @RelationId((detail: WorkProductDetail) => detail.tax)
    tax_id!: number;

    /**
     * Tasa de IVA aplicada al momento de crear el detalle.
     * Este valor se guarda para mantener la consistencia histórica,
     * independientemente de los cambios futuros en la tabla de impuestos.
     */
    @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
    @IsNumber()
    @IsOptional()
    @Min(0, { message: "La tasa de impuesto no puede ser negativa" })
    @Max(100, { message: "La tasa de impuesto no puede ser mayor al 100%" })
    applied_tax_rate?: number;

    @Column()
    @IsNumber()
    @Min(1, { message: "La cantidad debe ser al menos 1" })
    quantity!: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    @IsNumber()
    @Min(0, { message: "El precio de venta no puede ser negativo" })
    sale_price!: number;

    @Column({ type: "decimal", precision: 5, scale: 2 })
    @IsNumber()
    @Min(0, { message: "El descuento no puede ser negativo" })
    discount!: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    @IsNumber()
    @Min(0, { message: "El precio de mano de obra no puede ser negativo" })
    labor_price!: number;
}