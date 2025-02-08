import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, RelationId } from "typeorm";
import { IsNumber, Min } from "class-validator";
import { WorkOrder } from "./workOrderEntity";
import { Product } from "./productEntity";
import { Quotation } from "./quotationEntity";
import { Tax } from "./taxEntity";

@Entity("work_product_details")
export class WorkProductDetail {
    @PrimaryGeneratedColumn()
    work_product_detail_id!: number;

    @ManyToOne(() => WorkOrder, { nullable: true /*, cascade: true*/ })
    @JoinColumn({ name: "work_order_id" })
    work_order!: WorkOrder;

    @RelationId((detail: WorkProductDetail) => detail.work_order)
    work_order_id!: number;

    @ManyToOne(() => Product, { nullable: false })
    @JoinColumn({ name: "product_id" })
    product!: Product;
    
    @RelationId((detail: WorkProductDetail) => detail.product)
    product_id!: number;

    @ManyToOne(() => Quotation, { nullable: true /*, cascade: true*/ })
    @JoinColumn({ name: "quotation_id" })
    quotation!: Quotation;

    @RelationId((detail: WorkProductDetail) => detail.quotation)
    quotation_id!: number;

    @ManyToOne(() => Tax, { nullable: false })
    @JoinColumn({ name: "tax_id" })
    tax!: Tax;

    @RelationId((detail: WorkProductDetail) => detail.tax)
    tax_id!: number;

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