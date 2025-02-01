import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { IsNumber, Min } from "class-validator";
import { WorkOrder } from "./workOrderEntity";
import { Product } from "./productEntity";
import { Quotation } from "./quotationEntity";
import { Tax } from "./taxEntity";

@Entity("work_product_details")
export class WorkProductDetail {
    @PrimaryGeneratedColumn()
    work_product_detail_id!: number;

    @Column()
    work_order_id!: number;

    @Column()
    product_id!: number;

    @Column()
    quotation_id!: number;

    @Column()
    tax_id!: number;

    @ManyToOne(() => WorkOrder, { nullable: false })
    @JoinColumn({ name: "work_order_id" })
    work_order!: WorkOrder;

    @ManyToOne(() => Product, { nullable: false })
    @JoinColumn({ name: "product_id" })
    product!: Product;

    @ManyToOne(() => Quotation, { nullable: false })
    @JoinColumn({ name: "quotation_id" })
    quotation!: Quotation;

    @ManyToOne(() => Tax, { nullable: false })
    @JoinColumn({ name: "tax_id" })
    tax!: Tax;

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